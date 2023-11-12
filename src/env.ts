import { config } from 'dotenv';
config();

export const getEnvVar = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Tried to get env var ${key} but it was falsey`);
    }
    return value;
}