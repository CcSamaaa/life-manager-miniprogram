// 训练计划模板（灵感来自「训记」计划系统）
// 每个模板：{ id, name, desc, tag, days:[{ name, exercises:[{ exId, sets, reps, rest }] }] }
// rest 单位：秒；reps 为字符串，支持 "8" / "45s"（计时类）等
const TEMPLATES = [
  {
    id: 'ppl',
    name: '推拉腿 PPL',
    desc: '经典三分化，适合进阶训练者',
    tag: '分化',
    days: [
      { name: 'Day1 推（胸肩三头）', exercises: [
        { exId: 'bench_barbell', sets: 4, reps: '8', rest: 90 },
        { exId: 'ohp', sets: 3, reps: '10', rest: 75 },
        { exId: 'fly_dumbbell', sets: 3, reps: '12', rest: 60 },
        { exId: 'dip', sets: 3, reps: '10', rest: 75 },
        { exId: 'tricep_pushdown', sets: 3, reps: '12', rest: 60 }
      ]},
      { name: 'Day2 拉（背二头）', exercises: [
        { exId: 'deadlift', sets: 3, reps: '5', rest: 120 },
        { exId: 'pullup', sets: 4, reps: '8', rest: 90 },
        { exId: 'row_barbell', sets: 3, reps: '10', rest: 75 },
        { exId: 'face_pull', sets: 3, reps: '15', rest: 45 },
        { exId: 'curl_barbell', sets: 3, reps: '10', rest: 60 }
      ]},
      { name: 'Day3 腿', exercises: [
        { exId: 'squat', sets: 4, reps: '8', rest: 120 },
        { exId: 'leg_press', sets: 3, reps: '12', rest: 90 },
        { exId: 'romanian_deadlift', sets: 3, reps: '10', rest: 90 },
        { exId: 'lunge', sets: 3, reps: '12', rest: 60 },
        { exId: 'calf', sets: 4, reps: '15', rest: 45 }
      ]}
    ]
  },
  {
    id: 'fullbody',
    name: '全身循环',
    desc: 'A/B/C 三轮，适合时间紧的上班族',
    tag: '全身',
    days: [
      { name: 'A 全身', exercises: [
        { exId: 'squat', sets: 3, reps: '8', rest: 75 },
        { exId: 'bench_barbell', sets: 3, reps: '8', rest: 75 },
        { exId: 'row_barbell', sets: 3, reps: '8', rest: 75 },
        { exId: 'plank', sets: 3, reps: '45s', rest: 60 }
      ]},
      { name: 'B 全身', exercises: [
        { exId: 'deadlift', sets: 3, reps: '5', rest: 90 },
        { exId: 'ohp', sets: 3, reps: '8', rest: 75 },
        { exId: 'pullup', sets: 3, reps: '8', rest: 75 },
        { exId: 'leg_raise', sets: 3, reps: '12', rest: 60 }
      ]},
      { name: 'C 全身', exercises: [
        { exId: 'lunge', sets: 3, reps: '10', rest: 60 },
        { exId: 'dip', sets: 3, reps: '10', rest: 75 },
        { exId: 'curl_dumbbell', sets: 3, reps: '10', rest: 60 },
        { exId: 'russian_twist', sets: 3, reps: '15', rest: 45 }
      ]}
    ]
  },
  {
    id: 'bro',
    name: '五分化',
    desc: '胸/背/腿/肩/臂，健美经典排法',
    tag: '分化',
    days: [
      { name: 'Day1 胸', exercises: [
        { exId: 'bench_barbell', sets: 4, reps: '8', rest: 90 },
        { exId: 'incline_barbell', sets: 3, reps: '10', rest: 75 },
        { exId: 'fly_dumbbell', sets: 3, reps: '12', rest: 60 },
        { exId: 'dip', sets: 3, reps: '10', rest: 75 }
      ]},
      { name: 'Day2 背', exercises: [
        { exId: 'deadlift', sets: 3, reps: '5', rest: 120 },
        { exId: 'pullup', sets: 4, reps: '8', rest: 90 },
        { exId: 'row_barbell', sets: 3, reps: '10', rest: 75 },
        { exId: 'lat_pulldown', sets: 3, reps: '12', rest: 60 }
      ]},
      { name: 'Day3 腿', exercises: [
        { exId: 'squat', sets: 4, reps: '8', rest: 120 },
        { exId: 'leg_press', sets: 3, reps: '12', rest: 90 },
        { exId: 'romanian_deadlift', sets: 3, reps: '10', rest: 90 },
        { exId: 'leg_curl', sets: 3, reps: '12', rest: 60 },
        { exId: 'calf', sets: 4, reps: '15', rest: 45 }
      ]},
      { name: 'Day4 肩', exercises: [
        { exId: 'ohp', sets: 3, reps: '8', rest: 75 },
        { exId: 'lateral_dumbbell', sets: 4, reps: '12', rest: 60 },
        { exId: 'rear_delt', sets: 3, reps: '15', rest: 45 },
        { exId: 'face_pull', sets: 3, reps: '15', rest: 45 }
      ]},
      { name: 'Day5 臂', exercises: [
        { exId: 'curl_barbell', sets: 4, reps: '10', rest: 60 },
        { exId: 'hammer', sets: 3, reps: '12', rest: 60 },
        { exId: 'tricep_pushdown', sets: 4, reps: '12', rest: 60 },
        { exId: 'skull_crusher', sets: 3, reps: '10', rest: 60 }
      ]}
    ]
  },
  {
    id: 'linear',
    name: '新手线性',
    desc: '每次加重一点点，快速打基础',
    tag: '新手',
    days: [
      { name: 'A 日', exercises: [
        { exId: 'squat', sets: 3, reps: '5', rest: 120 },
        { exId: 'bench_barbell', sets: 3, reps: '5', rest: 120 },
        { exId: 'row_barbell', sets: 3, reps: '5', rest: 90 }
      ]},
      { name: 'B 日', exercises: [
        { exId: 'squat', sets: 3, reps: '5', rest: 120 },
        { exId: 'ohp', sets: 3, reps: '5', rest: 120 },
        { exId: 'deadlift', sets: 1, reps: '5', rest: 120 }
      ]},
      { name: 'C 日', exercises: [
        { exId: 'squat', sets: 3, reps: '5', rest: 120 },
        { exId: 'bench_barbell', sets: 3, reps: '5', rest: 120 },
        { exId: 'pullup', sets: 3, reps: '5', rest: 90 }
      ]}
    ]
  },
  {
    id: 'home',
    name: '居家徒手',
    desc: '无需器械，随时随地开练',
    tag: '徒手',
    days: [
      { name: 'A 徒手', exercises: [
        { exId: 'pushup', sets: 4, reps: '12', rest: 60 },
        { exId: 'squat', sets: 3, reps: '15', rest: 60 },
        { exId: 'plank', sets: 3, reps: '45s', rest: 45 },
        { exId: 'leg_raise', sets: 3, reps: '12', rest: 45 }
      ]},
      { name: 'B 徒手', exercises: [
        { exId: 'pullup', sets: 4, reps: '8', rest: 75 },
        { exId: 'dip', sets: 3, reps: '10', rest: 60 },
        { exId: 'lunge', sets: 3, reps: '12', rest: 60 },
        { exId: 'russian_twist', sets: 3, reps: '15', rest: 45 }
      ]},
      { name: 'C 徒手', exercises: [
        { exId: 'pushup', sets: 3, reps: '15', rest: 60 },
        { exId: 'jump_rope', sets: 3, reps: '1min', rest: 60 },
        { exId: 'crunch', sets: 3, reps: '20', rest: 45 },
        { exId: 'plank', sets: 3, reps: '60s', rest: 45 }
      ]}
    ]
  }
];

module.exports = { TEMPLATES };
