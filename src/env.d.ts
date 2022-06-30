interface ImportMetaEnv extends Readonly<Record<string, string>> {
    readonly DEV: string,
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
