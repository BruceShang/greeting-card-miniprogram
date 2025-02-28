class Storage {
  private static instance: Storage;

  private constructor() {}

  static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  /**
   * 设置存储
   * @param key 键
   * @param value 值
   * @param expire 过期时间（秒），可选
   */
  set(key: string, value: any, expire?: number): void {
    const data = {
      value,
      expire: expire ? Date.now() + expire * 1000 : null,
    };
    try {
      wx.setStorageSync(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage set error:", e);
    }
  }

  /**
   * 获取存储
   * @param key 键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const data = wx.getStorageSync(key);
      if (!data) return defaultValue;

      const { value, expire } = JSON.parse(data);

      // 判断是否过期
      if (expire && expire < Date.now()) {
        this.remove(key);
        return defaultValue;
      }

      return value as T;
    } catch (e) {
      console.error("Storage get error:", e);
      return defaultValue;
    }
  }

  /**
   * 移除存储
   * @param key 键
   */
  remove(key: string): void {
    try {
      wx.removeStorageSync(key);
    } catch (e) {
      console.error("Storage remove error:", e);
    }
  }

  /**
   * 清空存储
   */
  clear(): void {
    try {
      wx.clearStorageSync();
    } catch (e) {
      console.error("Storage clear error:", e);
    }
  }

  /**
   * 获取存储信息
   */
  info(): WechatMiniprogram.GetStorageInfoSyncOption {
    try {
      return wx.getStorageInfoSync();
    } catch (e) {
      console.error("Storage info error:", e);
      return { keys: [], currentSize: 0, limitSize: 0 };
    }
  }
}

export const storage = Storage.getInstance();
