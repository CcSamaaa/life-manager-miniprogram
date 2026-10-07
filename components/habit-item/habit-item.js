Component({
  properties: {
    habitId: { type: String, value: '' },
    emoji: { type: String, value: '⭐' },
    name: { type: String, value: '' },
    targetType: { type: String, value: 'daily' }, // daily | weekly
    doneToday: { type: Boolean, value: false },
    weeklyDone: { type: Number, value: 0 },
    weeklyTarget: { type: Number, value: 1 },
    actionable: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      if (this.data.actionable) {
        this.triggerEvent('tap', { id: this.data.habitId });
      }
    }
  }
});
