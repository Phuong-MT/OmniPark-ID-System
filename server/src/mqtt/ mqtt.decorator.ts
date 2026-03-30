import { SetMetadata } from '@nestjs/common';

export const MQTT_SUBSCRIBE = 'MQTT_SUBSCRIBE';

export interface MqttRouteMeta {
    pattern: string;
}

export const MqttSubscribe = (pattern: string) =>
    SetMetadata(MQTT_SUBSCRIBE, { pattern });

export function compilePattern(pattern: string) {
    const paramNames: string[] = [];

    const regexParts: string[] = [];
    const mqttParts: string[] = [];

    for (const part of pattern.split('/')) {
        if (part === '+') {
            paramNames.push('');
            regexParts.push('([^/]+)');
            mqttParts.push('+');
        } else if (part === '#') {
            paramNames.push('');
            regexParts.push('(.*)');
            mqttParts.push('#');
        } else if (part.startsWith(':')) {
            paramNames.push(part.slice(1));
            regexParts.push('([^/]+)');
            mqttParts.push('+'); // 🔥 QUAN TRỌNG
        } else {
            regexParts.push(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            mqttParts.push(part);
        }
    }

    return {
        regex: new RegExp(`^${regexParts.join('/')}$`),
        paramNames,
        mqttTopic: mqttParts.join('/'),
    };
}

export function matchTopic(
    topic: string,
    compiled: ReturnType<typeof compilePattern>,
) {
    const match = topic.match(compiled.regex);
    if (!match) return null;

    const params: Record<string, string> = {};
    compiled.paramNames.forEach((name, idx) => {
        if (name) params[name] = match[idx + 1];
    });

    return params;
}
