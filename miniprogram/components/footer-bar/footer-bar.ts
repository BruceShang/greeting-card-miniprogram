Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  properties: {
    current: {
      type: Number,
      value: 0,
      observer: "_currentChange",
    },
    color: {
      type: String,
      value: "#7A7E83",
    },
    selectedColor: {
      type: String,
      value: "#3cc51f",
    },
    backgroundColor: {
      type: String,
      value: "#ffffff",
    },
    borderStyle: {
      type: String,
      value: "black",
    },
    list: {
      type: Array,
      value: [],
      observer: "_listChange",
    },
    safeAreaInsetBottom: {
      type: Boolean,
      value: true,
    },
    fixed: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    height: 50,
    safeAreaBottom: 0,
    isIphoneX: false,
    tabList: [] as Array<{
      pagePath: string;
      text: string;
      iconPath: string;
      selectedIconPath: string;
      badge?: string | number;
      dot?: boolean;
    }>,
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      const isIphoneX = this.isIphoneX(systemInfo);

      this.setData({
        isIphoneX,
        safeAreaBottom: isIphoneX
          ? systemInfo.safeArea.bottom - systemInfo.screenHeight + 34
          : 0,
        tabList: this.data.list,
      });
    },
  },

  methods: {
    isIphoneX(systemInfo: WechatMiniprogram.SystemInfo) {
      const models = [
        "iPhone X",
        "iPhone XR",
        "iPhone XS",
        "iPhone XS Max",
        "iPhone 11",
        "iPhone 11 Pro",
        "iPhone 11 Pro Max",
        "iPhone 12",
        "iPhone 12 mini",
        "iPhone 12 Pro",
        "iPhone 12 Pro Max",
        "iPhone 13",
        "iPhone 13 mini",
        "iPhone 13 Pro",
        "iPhone 13 Pro Max",
        "iPhone 14",
        "iPhone 14 Plus",
        "iPhone 14 Pro",
        "iPhone 14 Pro Max",
      ];
      return (
        models.some((model) => systemInfo.model.includes(model)) ||
        (systemInfo.safeArea && systemInfo.safeArea.top > 20)
      );
    },

    switchTab(e: WechatMiniprogram.TouchEvent) {
      const dataset = e.currentTarget.dataset;
      const index = dataset.index;
      const item = this.data.tabList[index];

      if (this.data.current === index) return;

      this.setData({ current: index });
      this.triggerEvent("change", {
        index,
        item,
      });
    },

    _currentChange(newVal: number) {
      if (typeof newVal !== "number" || newVal < 0) return;
      this.setData({ current: newVal });
    },

    _listChange(newVal: any[]) {
      this.setData({ tabList: newVal });
    },
  },
});
