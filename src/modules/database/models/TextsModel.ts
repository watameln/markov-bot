import FileDatabase from "../FileDatabase";

export default {
    findOne: (query: any) => FileDatabase.findOne("texts", query),
    updateOne: (query: any, update: any, options?: any) => FileDatabase.updateOne("texts", query, update, options),
    deleteOne: (query: any) => FileDatabase.deleteOne("texts", query),
    deleteMany: (query: any) => FileDatabase.deleteMany("texts", query),
};