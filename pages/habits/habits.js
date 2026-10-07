const { getOpenid, db, serverDate } = require('../../utils/cloud');
const { syncTheme } = require('../../utils/theme');

const EMOJIS = ['💧','🏃','🌙','🧘','📚','🔤','✍️','💰','🧹','📞','🍎','💡','🎯','🌿','☀️','🎵','🏋️','🚶','🧠','❤️'];

Page({
  data: {
    habits: [],
    emojis: EMOJIS,
    showForm: false,
    editId: null,
    form: { name: '', emoji: '💧', targetType: 'daily', targetCount: 1 }
  },

  onShow() {
    syncTheme(this);
    this.load();
  },

  async load() {
    const openid = await getOpenid();
    if (!openid) return;
    const res = await db().collection('habits').orderBy('order', 'asc').get();
    this.setData({ habits: res.data });
  },

  openAdd() {
    this.setData({
      showForm: true,
      editId: null,
      form: { name: '', emoji: '💧', targetType: 'daily', targetCount: 1 }
    });
  },

  openEdit(e) {
    const id = e.currentTarget.dataset.id;
    const h = this.data.habits.find(x => x._id === id);
    if (!h) return;
    this.setData({
      showForm: true,
      editId: id,
      form: { name: h.name, emoji: h.emoji, targetType: h.targetType, targetCount: h.targetCount }
    });
  },

  closeForm() {
    this.setData({ showForm: false });
  },

  noop() {},

  pickEmoji(e) {
    this.setData({ 'form.emoji': e.currentTarget.dataset.e });
  },

  setType(e) {
    const t = e.currentTarget.dataset.t;
    this.setData({
      'form.targetType': t,
      'form.targetCount': t === 'daily' ? 1 : 3
    });
  },

  stepCount(e) {
    const delta = Number(e.currentTarget.dataset.d);
    let v = this.data.form.targetCount + delta;
    if (v < 1) v = 1;
    if (v > 7) v = 7;
    this.setData({ 'form.targetCount': v });
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value });
  },

  async save() {
    const f = this.data.form;
    if (!f.name.trim()) {
      wx.showToast({ title: '请填写习惯名称', icon: 'none' });
      return;
    }
    const dbc = db();
    if (this.data.editId) {
      await dbc.collection('habits').doc(this.data.editId).update({
        data: { name: f.name, emoji: f.emoji, targetType: f.targetType, targetCount: f.targetCount }
      });
    } else {
      const count = this.data.habits.length;
      await dbc.collection('habits').add({
        data: {
          name: f.name,
          emoji: f.emoji,
          targetType: f.targetType,
          targetCount: f.targetCount,
          order: count,
          createdAt: serverDate()
        }
      });
    }
    this.setData({ showForm: false });
    this.load();
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除习惯',
      content: '确认删除该习惯？已产生的打卡记录将保留在数据库，但不再展示。',
      success: async (r) => {
        if (r.confirm) {
          await db().collection('habits').doc(id).remove();
          this.load();
        }
      }
    });
  }
});
