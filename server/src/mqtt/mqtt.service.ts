// mqtt.service.ts
import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscoveryService, Reflector } from '@nestjs/core';
import * as mqtt from 'mqtt';
import { compilePattern, matchTopic, MQTT_SUBSCRIBE } from './ mqtt.decorator';

interface Route {
    pattern: string;
    regex: RegExp;
    mqttTopic: string;
    paramNames: string[];
    handler: Function;
}

enum Qos {
    AT_MOST_ONCE = 0,
    AT_LEAST_ONCE = 1,
    EXACTLY_ONCE = 2,
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MqttService.name);
    private client!: mqtt.MqttClient;
    private routes: Route[] = [];

    constructor(
        private readonly config: ConfigService,
        private readonly discovery: DiscoveryService,
        private readonly reflector: Reflector,
    ) {}

    onModuleInit() {
        const url =
            this.config.get<string>('MQTT_BROKER_URL') ??
            'mqtt://localhost:1883';

        this.client = mqtt.connect(url);

        this.client.on('connect', () => {
            this.logger.log('Connected');
            this.bindControllers();
        });

        this.client.on('message', (topic, payload) => {
            this.dispatch(topic, payload);
        });
    }

    private bindControllers() {
        const controllers = this.discovery.getControllers();

        for (const wrapper of controllers) {
            const instance = wrapper.instance;
            if (!instance) continue;

            const proto = Object.getPrototypeOf(instance);

            for (const key of Object.getOwnPropertyNames(proto)) {
                const handler = instance[key];
                if (typeof handler !== 'function') continue;

                const meta = this.reflector.get(MQTT_SUBSCRIBE, handler);
                if (!meta) continue;

                const compiled = compilePattern(meta.pattern);

                this.client.subscribe(compiled.mqttTopic);

                this.routes.push({
                    pattern: meta.pattern,
                    mqttTopic: compiled.mqttTopic,
                    regex: compiled.regex,
                    paramNames: compiled.paramNames,
                    handler: handler.bind(instance),
                });

                this.logger.log(`Bind ${meta.pattern} → ${compiled.mqttTopic}`);
            }
        }
        console.log(this.routes);
    }

    private dispatch(topic: string, payload: Buffer) {
        for (const route of this.routes) {
            const params = matchTopic(topic, route);
            if (!params) continue;

            let data: any;
            try {
                data = JSON.parse(payload.toString());
            } catch {
                this.logger.warn(`Invalid JSON from ${topic}`);
                return;
            }

            route.handler(data, { topic, params });
            return;
        }

        this.logger.warn(`No handler for topic ${topic}`);
    }

    publish(topic: string, data: any, qos?: Qos) {
        this.client.publish(topic, JSON.stringify(data), {
            qos: qos ?? Qos.AT_MOST_ONCE,
        });
    }

    onModuleDestroy() {
        this.client?.end(true);
    }
}
