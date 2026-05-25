import FileDatabase from "../FileDatabase";

export default {
    findOne: (query: any, projection?: string | string[]) => FileDatabase.findOne("configs", query, projection),
    findOneAndUpdate: (query: any, update: any, options: any) => FileDatabase.findOneAndUpdate("configs", query, update, options),
    updateOne: (query: any, update: any, options?: any) => FileDatabase.updateOne("configs", query, update, options),
    deleteOne: (query: any) => FileDatabase.deleteOne("configs", query),
};