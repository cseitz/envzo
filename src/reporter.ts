import { EOL } from 'os';
import { EnvzoValidatorError, InvalidEnvironmentError, MissingEnvironmentError } from './errors';
import { EnvzoValidatorOptions } from './validators';


export type EnvzoReporterErrors = Record<string, EnvzoValidatorOptions<any, any> & {
    index: number,
    field: string,
    typeName: string,
    error: EnvzoValidatorError,
}>;

export type EnvzoReporter = (errors: EnvzoReporterErrors) => string;
export type EnvzoReportHandler = (output: string) => void;

export const defaultEnvzoReporter: EnvzoReporter = (errors) => {
    const keys = Object.keys(errors);

    const invalids: string[] = [];
    const missing: string[] = [];

    for (const key of keys) {
        const validated = errors[key];
        const { error, typeName } = validated;
        const envKey = (validated as any)?.key ? `$${(validated as any)?.key}` : `${key}`;
        if (error instanceof MissingEnvironmentError) {
            missing.push(`  (${typeName})\t${envKey} : ${error.message || 'required'}`);
        } else if (error instanceof InvalidEnvironmentError) {
            invalids.push(`  (${typeName})\t${envKey} : ${error.message || 'invalid'}`)
        } else {
            return error;
        }
    }

    if (invalids.length) {
        invalids.unshift('❌ Invalid environment variables:');
    }
    if (missing.length) {
        missing.unshift('💨 Missing environment variables:');
    }


    const output: string[] = [
        '========================================',
        ...invalids,
        ...missing,
        '========================================',
    ];

    return output.join(EOL);
}

export const defaultEnvzoReportHandler: EnvzoReportHandler = (output) => {
    console.error(output);
    // throw new Error(`Environment Failure`)
    process.exit(1);
}

