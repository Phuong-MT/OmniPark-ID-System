import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ParkDocument = Park & Document;

@Schema({ timestamps: true })
export class Park {
  @Prop({ type: Types.ObjectId, required: true, ref: "Tenant" })
  tenantCode: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({
    enum: ["active", "inactive"],
    default: "active",
  })
  status: string;

  // 🗺️ Map config
  @Prop({
    type: {
      image: {
        original: String,
        preview: String,
        thumbnail: String,
      },
      config: {
        width: Number,
        height: Number,
        scale: { type: Number, default: 1 },
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number], // [lng, lat]
        },
      },
    },
  })
  map: {
    image?: {
      original?: string;
      preview?: string;
      thumbnail?: string;
    };
    config?: {
      width?: number;
      height?: number;
      scale?: number;
    };
    location?: {
      type: "Point";
      coordinates: number[];
    };
  };

  // 📍 Clusters (embed nhẹ)
  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, auto: true },

        name: { type: String, required: true },

        position: {
          x: Number,
          y: Number,
          lat: Number,
          lng: Number,
        },

        stats: {
          totalDevices: { type: Number, default: 0 },
          onlineDevices: { type: Number, default: 0 }
        },

        metadata: {
          type: Object,
          default: {},
        },
      },
    ],
    default: [],
  })
  clusters: {
    _id: Types.ObjectId;
    name: string;
    position: {
      x?: number;
      y?: number;
      lat?: number;
      lng?: number;
    };
    stats: {
      totalDevices: number;
      onlineDevices: number;
      cameraCount: number;
    };
    metadata?: Record<string, any>;
  }[];

  // 📊 Tổng quan park
  @Prop({
    type: {
      totalDevices: { type: Number, default: 0 },
      onlineDevices: { type: Number, default: 0 },
    },
    default: {},
  })
  stats: {
    totalDevices: number;
    onlineDevices: number;
  };

  // ⚙️ mở rộng sau này
//   @Prop({ type: Object, default: {} })
//   settings: Record<string, any>;
}

export const ParkSchema = SchemaFactory.createForClass(Park);