import FileDatabase from "../FileDatabase";

export default {
    deleteOne: (query: any) => FileDatabase.deleteOne("notrack", query),
    create: (document: any) => FileDatabase.create("notrack", document),
    exists: (query: any) => FileDatabase.exists("notrack", query),
};