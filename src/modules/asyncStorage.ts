import _AsyncStorage from "@react-native-async-storage/async-storage";

export type MultiGetResult<
  K extends string,
  T extends Record<K, unknown> = Record<K, string>
> = { [k in K]: T[k] | null };

const AsyncStorage = {
  async clear(): Promise<void> {
    await _AsyncStorage.clear();
  },

  async getAllKeys(): Promise<readonly string[]> {
    return await _AsyncStorage.getAllKeys();
  },

  async getItem<T>(key: string): Promise<T | null> {
    const value = await _AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  async setItem<T>(key: string, value: T | null): Promise<void> {
    if (value === null) {
      await _AsyncStorage.removeItem(key);
    } else {
      await _AsyncStorage.setItem(key, JSON.stringify(value));
    }
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.setItem(key, null);
  },

  async multiGet<
    K extends string,
    T extends Record<K, unknown> = Record<K, string>
  >(keys: readonly K[]): Promise<MultiGetResult<K, T>> {
    const results = Object.fromEntries(
      await _AsyncStorage.multiGet(keys)
    ) as Partial<Record<keyof T & string, string | null>>;
    return keys.reduce((acc, key) => {
      const value = results[key];
      acc[key] = value ? JSON.parse(value) : null;
      return acc;
    }, {} as MultiGetResult<K, T>);
  },

  async multiSet<T extends Record<string, unknown> = Record<string, string>>(
    values: T
  ): Promise<void> {
    const { setPairs, removeKeys } = Object.entries(values).reduce<{
      setPairs: [string, string][];
      removeKeys: string[];
    }>(
      (acc, [key, value]) => {
        if (value !== null) {
          acc.setPairs.push([key, JSON.stringify(value)]);
        } else {
          acc.removeKeys.push(key);
        }

        return acc;
      },
      { setPairs: [], removeKeys: [] }
    );

    const setOp =
      setPairs.length > 0
        ? _AsyncStorage.multiSet(setPairs)
        : Promise.resolve();
    const removeOp =
      removeKeys.length > 0
        ? _AsyncStorage.multiRemove(removeKeys)
        : Promise.resolve();

    await Promise.all([setOp, removeOp]);
  },

  async multiRemove(keys: readonly string[]): Promise<void> {
    await AsyncStorage.multiSet(
      keys.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {} as Record<string, null>)
    );
  },
};

export default AsyncStorage;

const { clear, getAllKeys, getItem, setItem, multiGet, multiSet } =
  AsyncStorage;

export { clear, getAllKeys, getItem, multiGet, multiSet, setItem };
