const { loadProfile, saveProfile } = require('../../utils/profile');
const { calcBMR, calcTDEE, ACTIVITY_LABELS } = require('../../utils/calorie');
const { getTheme } = require('../../utils/theme');

// 活动系数选项（久坐 / 轻度 / 中度 / 高强度）
const ACTIVITY_OPTIONS = [
  { key: 'sedentary', label: '久坐' },
  { key: 'light', label: '轻度' },
  { key: 'moderate', label: '中度' },
  { key: 'high', label: '高强度' }
];

Page({
  data: {
    _id: null,
    avatarUrl: '',
    avatarFileID: '',
    name: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    // 活动系数
    activityOptions: ACTIVITY_OPTIONS,
    activity: 'light',
    activityLabel: '轻度',
    bmr: null,
    tdee: null,
    saving: false,
    // 深浅色模式
    theme: 'light'
  },

  onShow() {
    const theme = getTheme();
    this.setData({ theme });
    this.applyNavBar(theme);
    this.load();
  },

  // 同步导航栏颜色
  applyNavBar(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#15171a', backgroundColorTop: '#15171a', backgroundColorBottom: '#15171a' });
    } else {
      wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#f5f6f8', backgroundColorTop: '#f5f6f8', backgroundColorBottom: '#f5f6f8' });
    }
  },

  async load() {
    const p = await loadProfile();
    if (!p) return;
    const activity = p.activity && ACTIVITY_LABELS[p.activity] ? p.activity : 'light';
    this.setData({
      _id: p._id,
      name: p.name || '',
      gender: p.gender || '',
      age: p.age ? String(p.age) : '',
      height: p.height ? String(p.height) : '',
      weight: p.weight ? String(p.weight) : '',
      avatarFileID: p.avatar || '',
      activity,
      activityLabel: ACTIVITY_LABELS[activity]
    });
    if (p.avatar) {
      wx.cloud.getTempFileURL({
        fileList: [p.avatar],
        success: (r) => {
          const url = r.fileList && r.fileList[0] && r.fileList[0].tempFileURL;
          if (url) this.setData({ avatarUrl: url });
        }
      });
    }
    this.refreshBMR();
  },

  // 根据已填资料实时计算 BMR / TDEE
  refreshBMR() {
    const { gender, age, height, weight, activity } = this.data;
    if (gender && age && height && weight) {
      const bmr = calcBMR({ gender, age: Number(age), height: Number(height), weight: Number(weight) });
      this.setData({
        bmr,
        tdee: calcTDEE(bmr, activity),
        activityLabel: ACTIVITY_LABELS[activity]
      });
    } else {
      this.setData({ bmr: null, tdee: null, activityLabel: ACTIVITY_LABELS[activity] });
    }
  },

  chooseAvatar() {
    const self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const temp = res.tempFiles[0].tempFilePath;
        self.setData({ avatarUrl: temp });
        const m = temp.match(/\.(\w+)$/);
        const ext = m ? m[1] : 'jpg';
        const cloudPath = `avatar/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: temp,
        success(up) {
          self.setData({ avatarFileID: up.fileID });
          self.persist();
        },
        fail() { wx.showToast({ title: '头像上传失败', icon: 'none' }); }
        });
      }
    });
  },

  editName() {
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '输入昵称',
      content: this.data.name,
      success: (r) => {
      if (r.confirm) {
        const name = (r.content || '').trim();
        this.setData({ name });
        this.persist();
      }
    }
    });
  },

  chooseGender() {
    wx.showActionSheet({
      itemList: ['男', '女'],
      success: (r) => {
        this.setData({ gender: r.tapIndex === 0 ? '男' : '女' });
        this.refreshBMR();
      }
    });
  },

  // 选择活动系数
  chooseActivity() {
    const labels = this.data.activityOptions.map(o => o.label);
    wx.showActionSheet({
      itemList: labels,
      success: (r) => {
        const opt = this.data.activityOptions[r.tapIndex];
        this.setData({ activity: opt.key, activityLabel: opt.label });
        this.refreshBMR();
      }
    });
  },

  onAge(e) { this.setData({ age: e.detail.value }); this.refreshBMR(); },
  onHeight(e) { this.setData({ height: e.detail.value }); this.refreshBMR(); },
  onWeight(e) { this.setData({ weight: e.detail.value }); this.refreshBMR(); },

  // 保存资料（昵称/头像可独立保存；身体数据可选，仅用于计算 BMR/TDEE）
  async persist() {
    const d = this.data;
    const payload = {
      name: d.name || '微信用户',
      activity: d.activity,
      avatar: d.avatarFileID
    };
    if (d.gender) payload.gender = d.gender;
    if (d.age) payload.age = Number(d.age);
    if (d.height) payload.height = Number(d.height);
    if (d.weight) payload.weight = Number(d.weight);
    await saveProfile(payload);
  },

  async save() {
    this.setData({ saving: true });
    try {
      await this.persist();
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
