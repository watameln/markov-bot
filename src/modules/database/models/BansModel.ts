import FileDatabase from "../FileDatabase";

export default {
    findOneAndUpdate: (query: any, update: any, options: any) => FileDatabase.findOneAndUpdate("bans", query, update, options),
    deleteOne: (query: any) => FileDatabase.deleteOne("bans", query),
    find: (query: any) => FileDatabase.find("bans", query),
};