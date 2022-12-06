import {Mutex} from 'async-mutex';

/** A factory that produces a value. */
export interface ValueFactory<T> {
    (): Promise<T> | T;
}


/** An accessor to a variable that is protected by a mutex. */
export class MutexProtectedVariable<T> {
    /** Mutex to prevent access to the variable before it is set or while it is being changed. */
    private _mutex = new Mutex();

    /** The value that is protected by the mutex. */
    private _value!: T;

    /**
     * Create a new MutexProtectedVariable with the initial value produced by the given factory.
     * The factory must not throw an error.
     * @param initialValueFactory A factory that will produce the initial value.
     */
    constructor(initialValueFactory: ValueFactory<T>) {
        this.set(initialValueFactory).catch(
            (error) => console.error(`Failed to get initial value for MutexProtectedVariable: ${error}`));
    }

    /**
     * @returns The value, but wait if the value is not initialized yet or if it is being changed at the moment.
     */
    async get(): Promise<T> {
        await this._mutex.waitForUnlock();
        return this._value;
    }

    /**
     * Change the value.
     * @param valueFactory A factory that will produce the value.
     * @returns The new value.
     */
    set<U extends T>(valueFactory: ValueFactory<U>): Promise<U> {
        return this._mutex.runExclusive(async () => {
            return this._value = await valueFactory();
        });
    }
}

/** A mutex protected wrapper of a variable whose value is read from and written to local storage. */
export abstract class MutexProtectedLocalStorageVariable<T> extends MutexProtectedVariable<T | null> {
    /** The key under which the value is stored in local storage. */
    private readonly _storageKey;

    /**
     * Create a new MutexProtectedLocalStorageVariable with the given storage key.
     * @param storageKey The under which the value is stored in local storage.
     */
    protected constructor(storageKey: string) {
        super(async () => {
            const rawValue = (await chrome.storage.local.get(storageKey))[storageKey];
            return rawValue ? this._deserialize(rawValue) : null;
        });
        this._storageKey = storageKey;
    }

    set<U extends T | null>(valueFactory: ValueFactory<U>): Promise<U> {
        return super.set(async () => {
            const value = await valueFactory();
            await this._save(value);
            return value;
        })
    }

    /**
     * Save the value to local storage.
     * @param value The new value to save.
     */
    private _save(value: T | null): Promise<void> {
        return chrome.storage.local.set({
            [this._storageKey]: this._serialize(value),
        });
    }

    /**
     * Serialize the value into a format that can be saved to local storage.
     * @see _deserialize
     * @param value A value to serialize.
     * @returns The serialized value that can be saved to local storage.
     */
    protected abstract _serialize(value: T | null): any;

    /**
     * Deserialize a value that was serialized with the {@link _serialize} function.
     * @param rawValue The raw value to deserialize.
     * @returns The deserialized value.
     */
    protected abstract _deserialize(rawValue: any): T | null;
}
