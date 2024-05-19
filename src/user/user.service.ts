import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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
        webAuthnChallenge: {
          create: {
            challenge: challengePayload.challenge,
            passKey: {},
          },
        },
      },
      include: {
        webAuthnChallenge: true,
      },
    });

    return { user: newUser, options: challengePayload };
  }

  async registerVerify(userId: string, credential: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        webAuthnChallenge: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const { verified, registrationInfo } = await this.webAUTH.verifyRegisration(
      {
        challenge: user.webAuthnChallenge.challenge as string,
        credential,
      },
    );

    if (!verified) {
      throw new HttpException('WebAuthn verification failed', 400);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        webAuthnChallenge: {
          update: {
            passKey: this.webAUTH.formatPassKeyCredentialToJson({
              registrationInfo,
            }),
          },
        },
      },
    });

    return { verified: true };
  }

  async loginChallenge(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        webAuthnChallenge: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const options = await this.webAUTH.loginOptions();

    await this.prisma.user.update({
      where: { email },
      data: {
        webAuthnChallenge: {
          update: {
            challenge: options.challenge,
          },
        },
      },
    });

    return options;
  }

  async loginVerify(email: string, credential: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        webAuthnChallenge: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const passKeyData = user.webAuthnChallenge.passKey as any;
    const transformedPassKey = this.webAUTH.formatPassKeyCredentialToBuffer({
      passKeyData,
    });

    const { verified } = await verifyAuthenticationResponse({
      expectedChallenge: user.webAuthnChallenge.challenge as string,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
      response: credential,
      authenticator: transformedPassKey as any,
    });

    if (!verified) {
      throw new HttpException('WebAuthn verification failed', 400);
    }

    delete user.webAuthnChallenge;
    delete user.webAuthnChallengeId;

    return { verified: true, user };
  }
}
