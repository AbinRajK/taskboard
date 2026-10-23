// Sends `id` instead of Mongo's `_id` and hides `__v`.
export const jsonOptions = {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
};
