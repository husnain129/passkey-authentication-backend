import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { WebAuthn } from './web-authn';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  webAUTH = new WebAuthn();

  async register(createUserDto: Prisma.UserCreateInput) {
    const isUserExist = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
      },
    });

    if (isUserExist) {
      throw new HttpException('User already exists', 400);
    }

    const challengePayload = await this.webAUTH.registrationOptions({
      email: createUserDto.email,
    });

    const newUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
      },
    });

    await this.prisma.webAuthnChallenge.create({
      data: {
        challenge: challengePayload.challenge,
        passKey: null,
        User: { connect: { id: newUser.id } },
      },
    });

    return { user: newUser, options: challengePayload };
  }

  async registerVerify(userId: string, credential: any) {
    const chellanges = await this.prisma.webAuthnChallenge.findMany({
      where: {
        userId,
      },
    });

    if (chellanges.length === 0) {
      throw new HttpException('User not found', 404);
    }

    for (const chellage of chellanges) {
      const { verified, registrationInfo } =
        await this.webAUTH.verifyRegisration({
          challenge: chellage.challenge as string,
          credential,
        });

      if (!verified) {
        continue;
      }

      await this.prisma.webAuthnChallenge.update({
        where: { id: chellage.id },
        data: {
          passKey: this.webAUTH.formatPassKeyCredentialToJson({
            registrationInfo,
          }),
        },
      });

      return { verified: true };
    }

    return { verified: false };
  }

  async loginChallenge(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const chellanges = await this.prisma.webAuthnChallenge.findMany({
      where: {
        userId: user.id,
      },
    });

    if (chellanges.length === 0) {
      throw new HttpException('User not found', 404);
    }

    const options = await this.webAUTH.loginOptions();
    for (const chellage of chellanges) {
      await this.prisma.webAuthnChallenge.update({
        where: { id: chellage.id },
        data: {
          challenge: options.challenge,
        },
      });
    }
    return options;
  }

  async loginVerify(email: string, credential: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const chellanges = await this.prisma.webAuthnChallenge.findMany({
      where: {
        userId: user.id,
      },
    });

    if (chellanges.length === 0) {
      throw new HttpException('User not found', 404);
    }

    for (const chellage of chellanges) {
      const passKeyData = chellage.passKey as any;
      const transformedPassKey = this.webAUTH.formatPassKeyCredentialToBuffer({
        passKeyData,
      });

      const { verified } = await this.webAUTH.loginVerify({
        chellage,
        credential,
        transformedPassKey,
      });

      if (!verified) {
        continue;
      }

      return { verified: true, user };
    }
    return { verified: false, user };
  }
}
