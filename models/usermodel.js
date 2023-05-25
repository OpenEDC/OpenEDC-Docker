export class User {
    constructor(oid, username, authenticationKey, hasInitialPassword, encryptedDecryptionKey, rights, ownerProtected, site) {
        this.oid = oid;
        this.username = username;
        this.authenticationKey = authenticationKey;
        this.hasInitialPassword = hasInitialPassword;
        this.encryptedDecryptionKey = encryptedDecryptionKey;
        this.rights = rights || [];
        this.ownerProtected = ownerProtected
        this.site = site; 
    }

    hasAuthorizationFor(right) {
        return this.rights && this.rights.includes(right);
    }
}
