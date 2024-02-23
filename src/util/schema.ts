import { Schema } from "mongoose";

const _fileSchema = new Schema(
  {
    ext: { type: String },
    mime: { type: String },
    type: { type: String, enum: ['image', 'video'] },
    thumbnail: { type: String },
    filename: { type: String },
    size: { type: Number },
    dimensions: {
      type: new Schema(
        {
          height: { type: Number, required: true },
          width: { type: Number, required: true },
          orientation: { type: Number, required: true },
        },
        { _id: false },
      ),
    },
  },
  { timestamps: false, _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export const fileSchema = _fileSchema;