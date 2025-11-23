declare const __APP_VERSION__: string | undefined;

const getAppVersion = (): string => {
    if (typeof __APP_VERSION__ !== "undefined") {
        return __APP_VERSION__;
    }

    try {
        const pkg = require("../../package.json");
        return pkg.version || "0.0.0";
    } catch {
        return "0.0.0";
    }
};

export const APP_VERSION = getAppVersion();
