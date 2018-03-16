/// <reference path="index.d.ts" />

declare namespace CRI {
    namespace Security {
        type CertificateId = number;
        type SecurityState = 'unknown' | 'neutral' | 'insecure' | 'secure' | 'info';
        type MixedContentType = 'blockable' | 'optionally-blockable' | 'none';
    }
}
