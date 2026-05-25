import FileDatabase from "./FileDatabase";

export default class DatabaseConnection {
    private path?: string;

    constructor(path?: string) {
        this.path = path;
    }

    /**
     * Connects to the application database.
     */
    public connect(): Promise<void> {
        return FileDatabase.connect(this.path);
    }
}