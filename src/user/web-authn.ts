import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

export class WebAuthn {
  constructor() {}

  private rpID = 'localhost';
  private rpName = 'My Localhost Machine';
  private expectedOrigin = 'http://localhost:3000';

  async registrationOptions({ email }: { email: string }) {
    try {
      return await generateRegistrationOptions({
        rpID: this.rpID,
        rpName: this.rpName,
        attestationType: 'none',
        userName: email,
        timeout: 30_000,
      });
    } catch (error) {}
  }

  async verifyRegisration({
    challenge,
    credential,
  }: {
    challenge: string;
    credential: any;
  }) {
    return await verifyRegistrationResponse({
      expectedChallenge: challenge,
      expectedOrigin: this.expectedOrigin,
      expectedRPID: this.rpID,
      response: credential,
    });
  }

  async loginOptions() {
    return await generateAuthenticationOptions({
      rpID: 'localhost',
    });
  }

  formatPassKeyCredentialToJson({
    registrationInfo,
  }: {
    registrationInfo: any;
  }) {
    return {
      fmt: registrationInfo.fmt,
      counter: registrationInfo.counter,
      aaguid: registrationInfo.aaguid,
      credentialID: Buffer.from(registrationInfo.credentialID).toString(
        'base64',
      ),
      credentialPublicKey: Buffer.from(
        registrationInfo.credentialPublicKey,
      ).toString('base64'),
      credentialType: registrationInfo.credentialType,
      attestationObject: Buffer.from(
        registrationInfo.attestationObject,
      ).toString('base64'),
      userVerified: registrationInfo.userVerified,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      origin: registrationInfo.origin,
      rpID: registrationInfo.rpID,
    };
  }

  formatPassKeyCredentialToBuffer({ passKeyData }: { passKeyData: any }) {
    return {
      fmt: passKeyData.fmt,
      counter: passKeyData.counter,
      aaguid: passKeyData.aaguid,
      credentialID: Uint8Array.from(
        Buffer.from(passKeyData.credentialID, 'base64'),
      ),
      credentialPublicKey: Uint8Array.from(
        Buffer.from(passKeyData.credentialPublicKey, 'base64'),
      ),
      credentialType: passKeyData.credentialType,
      attestationObject: Uint8Array.from(
        Buffer.from(passKeyData.attestationObject, 'base64'),
      ),
      userVerified: passKeyData.userVerified,
      credentialDeviceType: passKeyData.credentialDeviceType,
      credentialBackedUp: passKeyData.credentialBackedUp,
      origin: passKeyData.origin,
      rpID: passKeyData.rpID,
    };
  }
}
