import mongoose, { Document, Schema } from 'mongoose';

export interface IGuild extends Document {
  guildId: string;
  name: string;
  channelId: string;
  prefix?: string;
  settings: {
    welcomeMessage?: string;
    autoRole?: string;
    logChannel?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const guildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  channelId: { type: String, required: true },
  prefix: { type: String, default: '!' },
  settings: {
    welcomeMessage: String,
    autoRole: String,
    logChannel: String
  }
}, {
  timestamps: true
});

export const GuildModel = mongoose.model<IGuild>('Guild', guildSchema); 