// 中国城市数据库（本地检索，无需网络请求）
// 覆盖：4个直辖市、所有地级市、主要县级市/县
// 每条：{ name, lat, lon, province }

const CITIES = [
  // ===== 直辖市 =====
  { name: '北京', lat: 39.9042, lon: 116.4074, province: '北京' },
  { name: '上海', lat: 31.2304, lon: 121.4737, province: '上海' },
  { name: '天津', lat: 39.3434, lon: 117.3616, province: '天津' },
  { name: '重庆', lat: 29.4316, lon: 106.9123, province: '重庆' },

  // ===== 河北 =====
  { name: '石家庄', lat: 38.0428, lon: 114.5149, province: '河北' },
  { name: '唐山', lat: 39.6263, lon: 118.1740, province: '河北' },
  { name: '秦皇岛', lat: 39.9354, lon: 119.5990, province: '河北' },
  { name: '邯郸', lat: 36.6086, lon: 114.4914, province: '河北' },
  { name: '邢台', lat: 37.0682, lon: 114.4847, province: '河北' },
  { name: '保定', lat: 38.8738, lon: 115.4652, province: '河北' },
  { name: '张家口', lat: 40.8117, lon: 114.8841, province: '河北' },
  { name: '承德', lat: 40.9510, lon: 117.9634, province: '河北' },
  { name: '沧州', lat: 38.3106, lon: 116.8570, province: '河北' },
  { name: '廊坊', lat: 39.5325, lon: 116.6836, province: '河北' },
  { name: '衡水', lat: 37.7350, lon: 115.6700, province: '河北' },
  { name: '雄安新区', lat: 39.0000, lon: 115.9000, province: '河北' },

  // ===== 山西 =====
  { name: '太原', lat: 37.8706, lon: 112.5489, province: '山西' },
  { name: '大同', lat: 40.0902, lon: 113.2980, province: '山西' },
  { name: '阳泉', lat: 37.8570, lon: 113.5780, province: '山西' },
  { name: '长治', lat: 36.1872, lon: 113.1136, province: '山西' },
  { name: '晋城', lat: 35.4971, lon: 112.8530, province: '山西' },
  { name: '朔州', lat: 39.3319, lon: 112.4336, province: '山西' },
  { name: '晋中', lat: 37.6800, lon: 112.7510, province: '山西' },
  { name: '运城', lat: 35.0258, lon: 111.0050, province: '山西' },
  { name: '忻州', lat: 38.4177, lon: 112.7337, province: '山西' },
  { name: '临汾', lat: 36.0840, lon: 111.5180, province: '山西' },
  { name: '吕梁', lat: 37.5180, lon: 111.1360, province: '山西' },

  // ===== 内蒙古 =====
  { name: '呼和浩特', lat: 40.8426, lon: 111.7508, province: '内蒙古' },
  { name: '包头', lat: 40.6582, lon: 109.8406, province: '内蒙古' },
  { name: '乌海', lat: 39.6500, lon: 106.8200, province: '内蒙古' },
  { name: '赤峰', lat: 42.2670, lon: 118.9670, province: '内蒙古' },
  { name: '通辽', lat: 43.6174, lon: 122.2640, province: '内蒙古' },
  { name: '鄂尔多斯', lat: 39.5819, lon: 109.9890, province: '内蒙古' },
  { name: '呼伦贝尔', lat: 49.2120, lon: 119.7650, province: '内蒙古' },
  { name: '巴彦淖尔', lat: 40.7410, lon: 107.3890, province: '内蒙古' },
  { name: '乌兰察布', lat: 41.0340, lon: 113.1140, province: '内蒙古' },
  { name: '兴安盟', lat: 46.0760, lon: 122.0670, province: '内蒙古' },
  { name: '锡林郭勒', lat: 43.9340, lon: 116.0820, province: '内蒙古' },
  { name: '阿拉善盟', lat: 38.8400, lon: 105.7000, province: '内蒙古' },

  // ===== 辽宁 =====
  { name: '沈阳', lat: 41.8057, lon: 123.4315, province: '辽宁' },
  { name: '大连', lat: 38.9140, lon: 121.6147, province: '辽宁' },
  { name: '鞍山', lat: 41.1086, lon: 122.9949, province: '辽宁' },
  { name: '抚顺', lat: 41.8762, lon: 123.9220, province: '辽宁' },
  { name: '本溪', lat: 41.2979, lon: 123.7638, province: '辽宁' },
  { name: '丹东', lat: 40.1249, lon: 124.3950, province: '辽宁' },
  { name: '锦州', lat: 41.1170, lon: 121.1260, province: '辽宁' },
  { name: '营口', lat: 40.6670, lon: 122.2340, province: '辽宁' },
  { name: '阜新', lat: 42.0100, lon: 121.6580, province: '辽宁' },
  { name: '辽阳', lat: 41.2700, lon: 123.1720, province: '辽宁' },
  { name: '盘锦', lat: 40.9960, lon: 122.0690, province: '辽宁' },
  { name: '铁岭', lat: 42.2940, lon: 123.8350, province: '辽宁' },
  { name: '朝阳', lat: 41.5770, lon: 120.4610, province: '辽宁' },
  { name: '葫芦岛', lat: 40.7200, lon: 120.8370, province: '辽宁' },

  // ===== 吉林 =====
  { name: '长春', lat: 43.8171, lon: 125.3235, province: '吉林' },
  { name: '吉林', lat: 43.8378, lon: 126.5490, province: '吉林' },
  { name: '四平', lat: 43.1700, lon: 124.3700, province: '吉林' },
  { name: '辽源', lat: 42.9020, lon: 125.1450, province: '吉林' },
  { name: '通化', lat: 41.7210, lon: 125.9390, province: '吉林' },
  { name: '白山', lat: 41.9430, lon: 126.4230, province: '吉林' },
  { name: '松原', lat: 45.1300, lon: 124.8230, province: '吉林' },
  { name: '白城', lat: 45.6180, lon: 122.8390, province: '吉林' },
  { name: '延边', lat: 42.8910, lon: 129.5070, province: '吉林' },

  // ===== 黑龙江 =====
  { name: '哈尔滨', lat: 45.8038, lon: 126.5350, province: '黑龙江' },
  { name: '齐齐哈尔', lat: 47.3409, lon: 123.9579, province: '黑龙江' },
  { name: '鸡西', lat: 45.2960, lon: 130.9740, province: '黑龙江' },
  { name: '鹤岗', lat: 47.3480, lon: 130.2940, province: '黑龙江' },
  { name: '双鸭山', lat: 46.6440, lon: 131.1590, province: '黑龙江' },
  { name: '大庆', lat: 46.5964, lon: 125.1127, province: '黑龙江' },
  { name: '伊春', lat: 47.7290, lon: 128.8990, province: '黑龙江' },
  { name: '佳木斯', lat: 46.8096, lon: 130.3540, province: '黑龙江' },
  { name: '七台河', lat: 45.7720, lon: 131.0030, province: '黑龙江' },
  { name: '牡丹江', lat: 44.5770, lon: 129.6180, province: '黑龙江' },
  { name: '黑河', lat: 50.2470, lon: 127.5000, province: '黑龙江' },
  { name: '绥化', lat: 46.6370,lon: 126.9880, province: '黑龙江' },
  { name: '大兴安岭', lat: 52.3330, lon: 124.7080, province: '黑龙江' },

  // ===== 江苏 =====
  { name: '南京', lat: 32.0603, lon: 118.7969, province: '江苏' },
  { name: '无锡', lat: 31.4912, lon: 120.3119, province: '江苏' },
  { name: '徐州', lat: 34.2618, lon: 117.1841, province: '江苏' },
  { name: '常州', lat: 31.7710, lon: 119.9560, province: '江苏' },
  { name: '苏州', lat: 31.2989, lon: 120.5853, province: '江苏' },
  { name: '南通', lat: 32.0090, lon: 120.8640, province: '江苏' },
  { name: '连云港', lat: 34.5967, lon: 119.1780, province: '江苏' },
  { name: '淮安', lat: 33.5910, lon: 119.0250, province: '江苏' },
  { name: '盐城', lat: 33.3776, lon: 120.1610, province: '江苏' },
  { name: '扬州', lat: 32.3932, lon: 119.4210, province: '江苏' },
  { name: '镇江', lat: 32.2044, lon: 119.4310, province: '江苏' },
  { name: '泰州', lat: 32.4900, lon: 119.9150, province: '江苏' },
  { name: '宿迁', lat: 33.9520, lon: 118.2780, province: '江苏' },

  // ===== 浙江 =====
  { name: '杭州', lat: 30.2741, lon: 120.1551, province: '浙江' },
  { name: '宁波', lat: 29.8683, lon: 121.5440, province: '浙江' },
  { name: '温州', lat: 27.9943, lon: 120.6994, province: '浙江' },
  { name: '嘉兴', lat: 30.7600, lon: 120.7500, province: '浙江' },
  { name: '湖州', lat: 30.8700, lon: 120.1000, province: '浙江' },
  { name: '绍兴', lat: 30.0020, lon: 120.5800, province: '浙江' },
  { name: '金华', lat: 29.0800, lon: 119.6500, province: '浙江' },
  { name: '衢州', lat: 28.9600, lon: 118.8700, province: '浙江' },
  { name: '舟山', lat: 30.0160, lon: 122.1070, province: '浙江' },
  { name: '台州', lat: 28.6580, lon: 121.4200, province: '浙江' },
  { name: '丽水', lat: 28.4500, lon: 119.9200, province: '浙江' },

  // ===== 安徽 =====
  { name: '合肥', lat: 31.8206, lon: 117.2272, province: '安徽' },
  { name: '芜湖', lat: 31.3260, lon: 118.3740, province: '安徽' },
  { name: '蚌埠', lat: 32.9400, lon: 117.3600, province: '安徽' },
  { name: '淮南', lat: 32.6500, lon: 117.0100, province: '安徽' },
  { name: '马鞍山', lat: 31.6880, lon: 118.5070, province: '安徽' },
  { name: '淮北', lat: 33.9700, lon: 116.7950, province: '安徽' },
  { name: '铜陵', lat: 30.9300, lon: 117.8130, province: '安徽' },
  { name: '安庆', lat: 30.5200, lon: 117.0500, province: '安徽' },
  { name: '黄山', lat: 29.7100, lon: 118.3200, province: '安徽' },
  { name: '滁州', lat: 32.3000, lon: 118.3100, province: '安徽' },
  { name: '阜阳', lat: 32.9000, lon: 115.8100, province: '安徽' },
  { name: '宿州', lat: 33.6400, lon: 116.9800, province: '安徽' },
  { name: '六安', lat: 31.7500, lon: 116.5000, province: '安徽' },
  { name: '亳州', lat: 33.8400, lon: 115.7800, province: '安徽' },
  { name: '池州', lat: 30.6500, lon: 117.4900, province: '安徽' },
  { name: '宣城', lat: 30.9500, lon: 118.7500, province: '安徽' },

  // ===== 福建 =====
  { name: '福州', lat: 26.0745, lon: 119.2965, province: '福建' },
  { name: '厦门', lat: 24.4798, lon: 118.0894, province: '福建' },
  { name: '莆田', lat: 25.4350, lon: 119.0150, province: '福建' },
  { name: '三明', lat: 26.2600, lon: 117.6350, province: '福建' },
  { name: '泉州', lat: 24.8741, lon: 118.6757, province: '福建' },
  { name: '漳州', lat: 24.5100, lon: 117.6500, province: '福建' },
  { name: '南平', lat: 26.6400, lon: 118.1750, province: '福建' },
  { name: '龙岩', lat: 25.0900, lon: 117.0340, province: '福建' },
  { name: '宁德', lat: 26.6600, lon: 119.5270, province: '福建' },

  // ===== 江西 =====
  { name: '南昌', lat: 28.6820, lon: 115.8579, province: '江西' },
  { name: '景德镇', lat: 29.2700, lon: 117.2100, province: '江西' },
  { name: '萍乡', lat: 27.6300, lon: 113.8500, province: '江西' },
  { name: '九江', lat: 29.7100, lon: 116.0000, province: '江西' },
  { name: '新余', lat: 27.8100, lon: 114.9300, province: '江西' },
  { name: '鹰潭', lat: 28.2400, lon: 117.0340, province: '江西' },
  { name: '赣州', lat: 25.8500, lon: 114.9400, province: '江西' },
  { name: '吉安', lat: 27.1100, lon: 114.9800, province: '江西' },
  { name: '宜春', lat: 27.8000, lon: 114.3800, province: '江西' },
  { name: '抚州', lat: 27.9500, lon: 116.3600, province: '江西' },
  { name: '上饶', lat: 28.4400, lon: 117.9700, province: '江西' },

  // ===== 山东 =====
  { name: '济南', lat: 36.6512, lon: 116.9972, province: '山东' },
  { name: '青岛', lat: 36.0671, lon: 120.3826, province: '山东' },
  { name: '淄博', lat: 36.8050, lon: 118.0500, province: '山东' },
  { name: '枣庄', lat: 34.8100, lon: 117.5500, province: '山东' },
  { name: '东营', lat: 37.4600, lon: 118.6700, province: '山东' },
  { name: '烟台', lat: 37.4638, lon: 121.4479, province: '山东' },
  { name: '潍坊', lat: 36.7040, lon: 119.1100, province: '山东' },
  { name: '济宁', lat: 35.4000, lon: 116.5800, province: '山东' },
  { name: '泰安', lat: 36.1900, lon: 117.1200, province: '山东' },
  { name: '威海', lat: 37.5070, lon: 122.1180, province: '山东' },
  { name: '日照', lat: 35.4200, lon: 119.4680, province: '山东' },
  { name: '临沂', lat: 35.0500, lon: 118.3500, province: '山东' },
  { name: '德州', lat: 37.4300, lon: 116.3100, province: '山东' },
  { name: '聊城', lat: 36.4500, lon: 115.9900, province: '山东' },
  { name: '滨州', lat: 37.3700, lon: 118.0200, province: '山东' },
  { name: '菏泽', lat: 35.2300, lon: 115.4800, province: '山东' },

  // ===== 河南 =====
  { name: '郑州', lat: 34.7466, lon: 113.6254, province: '河南' },
  { name: '开封', lat: 34.7900, lon: 114.3500, province: '河南' },
  { name: '洛阳', lat: 34.6200, lon: 112.4500, province: '河南' },
  { name: '平顶山', lat: 33.7700, lon: 113.1900, province: '河南' },
  { name: '安阳', lat: 36.1000, lon: 114.3500, province: '河南' },
  { name: '鹤壁', lat: 35.7500, lon: 114.2900, province: '河南' },
  { name: '新乡', lat: 35.3000, lon: 113.8700, province: '河南' },
  { name: '焦作', lat: 35.2200, lon: 113.2400, province: '河南' },
  { name: '濮阳', lat: 35.7600, lon: 115.0300, province: '河南' },
  { name: '许昌', lat: 34.0200, lon: 113.8500, province: '河南' },
  { name: '漯河', lat: 33.5700, lon: 114.0200, province: '河南' },
  { name: '三门峡', lat: 34.7700, lon: 111.2000, province: '河南' },
  { name: '南阳', lat: 33.0000, lon: 112.5300, province: '河南' },
  { name: '商丘', lat: 34.4400, lon: 115.6500, province: '河南' },
  { name: '信阳', lat: 32.1300, lon: 114.0700, province: '河南' },
  { name: '周口', lat: 33.6200, lon: 114.6500, province: '河南' },
  { name: '驻马店', lat: 32.9800, lon: 114.0200, province: '河南' },
  { name: '济源', lat: 35.0700, lon: 112.6000, province: '河南' },

  // ===== 湖北 =====
  { name: '武汉', lat: 30.5928, lon: 114.3055, province: '湖北' },
  { name: '黄石', lat: 30.2100, lon: 115.0900, province: '湖北' },
  { name: '十堰', lat: 32.6400, lon: 110.7800, province: '湖北' },
  { name: '宜昌', lat: 30.6920, lon: 111.2860, province: '湖北' },
  { name: '襄阳', lat: 32.0400, lon: 112.1400, province: '湖北' },
  { name: '鄂州', lat: 30.3900, lon: 114.8900, province: '湖北' },
  { name: '荆门', lat: 31.0400, lon: 112.2000, province: '湖北' },
  { name: '孝感', lat: 30.9200, lon: 113.9200, province: '湖北' },
  { name: '荆州', lat: 30.3500, lon: 112.2400, province: '湖北' },
  { name: '黄冈', lat: 30.4500, lon: 114.8700, province: '湖北' },
  { name: '咸宁', lat: 29.8300, lon: 114.3300, province: '湖北' },
  { name: '随州', lat: 31.7100, lon: 113.3700, province: '湖北' },
  { name: '恩施', lat: 30.2800, lon: 109.4800, province: '湖北' },

  // ===== 湖南 =====
  { name: '长沙', lat: 28.2282, lon: 112.9388, province: '湖南' },
  { name: '株洲', lat: 27.8300, lon: 113.1400, province: '湖南' },
  { name: '湘潭', lat: 27.8500, lon: 112.9100, province: '湖南' },
  { name: '衡阳', lat: 26.8900, lon: 112.6000, province: '湖南' },
  { name: '邵阳', lat: 27.2300, lon: 111.4700, province: '湖南' },
  { name: '岳阳', lat: 29.3700, lon: 113.1100, province: '湖南' },
  { name: '常德', lat: 29.0300, lon: 111.6900, province: '湖南' },
  { name: '张家界', lat: 29.1300, lon: 110.4800, province: '湖南' },
  { name: '益阳', lat: 28.5500, lon: 112.3600, province: '湖南' },
  { name: '郴州', lat: 25.7700, lon: 113.0200, province: '湖南' },
  { name: '永州', lat: 26.4300, lon: 111.6100, province: '湖南' },
  { name: '怀化', lat: 27.5500, lon: 109.9780, province: '湖南' },
  { name: '娄底', lat: 27.7300, lon: 112.0100, province: '湖南' },
  { name: '湘西', lat: 28.3100, lon: 109.7400, province: '湖南' },

  // ===== 广东 =====
  { name: '广州', lat: 23.1291, lon: 113.2644, province: '广东' },
  { name: '韶关', lat: 24.8100, lon: 113.5800, province: '广东' },
  { name: '深圳', lat: 22.5431, lon: 114.0579, province: '广东' },
  { name: '珠海', lat: 22.2711, lon: 113.5767, province: '广东' },
  { name: '汕头', lat: 23.3535, lon: 116.6820, province: '广东' },
  { name: '佛山', lat: 23.0218, lon: 113.1220, province: '广东' },
  { name: '江门', lat: 22.5780, lon: 113.0820, province: '广东' },
  { name: '湛江', lat: 21.2470, lon: 110.3650, province: '广东' },
  { name: '茂名', lat: 21.6680, lon: 110.9200, province: '广东' },
  { name: '肇庆', lat: 23.0500, lon: 112.4700, province: '广东' },
  { name: '惠州', lat: 23.1115, lon: 114.4150, province: '广东' },
  { name: '梅州', lat: 24.2900, lon: 116.1200, province: '广东' },
  { name: '汕尾', lat: 22.7700, lon: 115.3650, province: '广东' },
  { name: '河源', lat: 23.7400, lon: 114.7000, province: '广东' },
  { name: '阳江', lat: 21.8600, lon: 111.9850, province: '广东' },
  { name: '清远', lat: 23.6800, lon: 113.0500, province: '广东' },
  { name: '东莞', lat: 23.0200, lon: 113.7500, province: '广东' },
  { name: '中山', lat: 22.5200, lon: 113.3800, province: '广东' },
  { name: '潮州', lat: 23.6600, lon: 116.6300, province: '广东' },
  { name: '揭阳', lat: 23.5500, lon: 116.3700, province: '广东' },
  { name: '云浮', lat: 22.9300, lon: 112.0400, province: '广东' },

  // ===== 广西 =====
  { name: '南宁', lat: 22.8170, lon: 108.3665, province: '广西' },
  { name: '柳州', lat: 24.3200, lon: 109.4100, province: '广西' },
  { name: '桂林', lat: 25.2744, lon: 110.2900, province: '广西' },
  { name: '梧州', lat: 23.4700, lon: 111.3000, province: '广西' },
  { name: '北海', lat: 21.4700, lon: 109.1100, province: '广西' },
  { name: '防城港', lat: 21.6100, lon: 108.3500, province: '广西' },
  { name: '钦州', lat: 21.9600, lon: 108.6200, province: '广西' },
  { name: '贵港', lat: 23.0900, lon: 109.6000, province: '广西' },
  { name: '玉林', lat: 22.6300, lon: 110.1500, province: '广西' },
  { name: '百色', lat: 23.9000, lon: 106.6200, province: '广西' },
  { name: '贺州', lat: 24.4100, lon: 111.5500, province: '广西' },
  { name: '河池', lat: 24.6900, lon: 108.0600, province: '广西' },
  { name: '来宾', lat: 23.7300, lon: 109.2200, province: '广西' },
  { name: '崇左', lat: 22.3800, lon: 107.3700, province: '广西' },

  // ===== 海南 =====
  { name: '海口', lat: 20.0444, lon: 110.1999, province: '海南' },
  { name: '三亚', lat: 18.2528, lon: 109.5120, province: '海南' },
  { name: '三沙', lat: 16.8310, lon: 112.3350, province: '海南' },
  { name: '儋州', lat: 19.5200, lon: 109.5800, province: '海南' },

  // ===== 四川 =====
  { name: '成都', lat: 30.5728, lon: 104.0668, province: '四川' },
  { name: '自贡', lat: 29.3500, lon: 104.7700, province: '四川' },
  { name: '攀枝花', lat: 26.5800, lon: 101.7180, province: '四川' },
  { name: '泸州', lat: 28.8800, lon: 105.4400, province: '四川' },
  { name: '德阳', lat: 31.1300, lon: 104.4100, province: '四川' },
  { name: '绵阳', lat: 31.4680, lon: 104.7500, province: '四川' },
  { name: '广元', lat: 32.4300, lon: 105.8300, province: '四川' },
  { name: '遂宁', lat: 30.5100, lon: 105.5800, province: '四川' },
  { name: '内江', lat: 29.5800, lon: 105.0600, province: '四川' },
  { name: '乐山', lat: 29.5670, lon: 103.7670, province: '四川' },
  { name: '南充', lat: 30.7900, lon: 106.0860, province: '四川' },
  { name: '眉山', lat: 30.0500, lon: 103.8370, province: '四川' },
  { name: '宜宾', lat: 28.7600, lon: 104.6300, province: '四川' },
  { name: '广安', lat: 30.4700, lon: 106.6300, province: '四川' },
  { name: '达州', lat: 31.2100, lon: 107.5000, province: '四川' },
  { name: '雅安', lat: 30.0100, lon: 103.0300, province: '四川' },
  { name: '巴中', lat: 31.8600, lon: 106.7600, province: '四川' },
  { name: '资阳', lat: 30.1200, lon: 104.6500, province: '四川' },
  { name: '阿坝', lat: 31.9000, lon: 102.2200, province: '四川' },
  { name: '甘孜', lat: 30.0500, lon: 101.9600, province: '四川' },
  { name: '凉山', lat: 27.8900, lon: 102.2700, province: '四川' },

  // ===== 贵州 =====
  { name: '贵阳', lat: 26.6470, lon: 106.6302, province: '贵州' },
  { name: '六盘水', lat: 26.5900, lon: 104.8500, province: '贵州' },
  { name: '遵义', lat: 27.7100, lon: 106.9300, province: '贵州' },
  { name: '安顺', lat: 26.2500, lon: 105.9300, province: '贵州' },
  { name: '毕节', lat: 27.3000, lon: 105.2900, province: '贵州' },
  { name: '铜仁', lat: 27.7200, lon: 109.1900, province: '贵州' },
  { name: '黔西南', lat: 25.0900, lon: 104.9000, province: '贵州' },
  { name: '黔东南', lat: 26.5800, lon: 107.9800, province: '贵州' },
  { name: '黔南', lat: 26.2600, lon: 107.5200, province: '贵州' },

  // ===== 云南 =====
  { name: '昆明', lat: 25.0389, lon: 102.7183, province: '云南' },
  { name: '曲靖', lat: 25.4900, lon: 103.7900, province: '云南' },
  { name: '玉溪', lat: 24.3500, lon: 102.5400, province: '云南' },
  { name: '保山', lat: 25.1100, lon: 99.1600, province: '云南' },
  { name: '昭通', lat: 27.3400, lon: 103.7100, province: '云南' },
  { name: '丽江', lat: 26.8700, lon: 100.2300, province: '云南' },
  { name: '普洱', lat: 22.7800, lon: 100.9700, province: '云南' },
  { name: '临沧', lat: 23.8800, lon: 100.0900, province: '云南' },
  { name: '楚雄', lat: 25.0400, lon: 101.5500, province: '云南' },
  { name: '红河', lat: 23.3700, lon: 103.3800, province: '云南' },
  { name: '文山', lat: 23.3700, lon: 104.2400, province: '云南' },
  { name: '西双版纳', lat: 21.4800, lon: 101.5700, province: '云南' },
  { name: '大理', lat: 25.6000, lon: 100.2200, province: '云南' },
  { name: '德宏', lat: 24.4300, lon: 98.5800, province: '云南' },
  { name: '怒江', lat: 25.8200, lon: 98.8500, province: '云南' },
  { name: '迪庆', lat: 27.8200, lon: 99.7100, province: '云南' },

  // ===== 西藏 =====
  { name: '拉萨', lat: 29.6500, lon: 91.1200, province: '西藏' },
  { name: '日喀则', lat: 29.2700, lon: 88.8900, province: '西藏' },
  { name: '昌都', lat: 31.1300, lon: 97.1800, province: '西藏' },
  { name: '林芝', lat: 29.6500, lon: 94.3600, province: '西藏' },
  { name: '山南', lat: 29.2400, lon: 91.7700, province: '西藏' },
  { name: '那曲', lat: 31.4800, lon: 92.0600, province: '西藏' },
  { name: '阿里', lat: 32.5000, lon: 80.1000, province: '西藏' },

  // ===== 陕西 =====
  { name: '西安', lat: 34.3416, lon: 108.9398, province: '陕西' },
  { name: '铜川', lat: 34.9000, lon: 108.9400, province: '陕西' },
  { name: '宝鸡', lat: 34.3600, lon: 107.1700, province: '陕西' },
  { name: '咸阳', lat: 34.3300, lon: 108.7100, province: '陕西' },
  { name: '渭南', lat: 34.5000, lon: 109.5000, province: '陕西' },
  { name: '延安', lat: 36.5900, lon: 109.4900, province: '陕西' },
  { name: '汉中', lat: 33.0700, lon: 107.0300, province: '陕西' },
  { name: '榆林', lat: 38.2800, lon: 109.7300, province: '陕西' },
  { name: '安康', lat: 32.6900, lon: 108.6700, province: '陕西' },
  { name: '商洛', lat: 33.8700, lon: 109.9300, province: '陕西' },

  // ===== 甘肃 =====
  { name: '兰州', lat: 36.0611, lon: 103.8343, province: '甘肃' },
  { name: '嘉峪关', lat: 39.7800, lon: 98.2800, province: '甘肃' },
  { name: '金昌', lat: 38.2300, lon: 102.1900, province: '甘肃' },
  { name: '白银', lat: 36.5400, lon: 104.1400, province: '甘肃' },
  { name: '天水', lat: 34.5800, lon: 105.7200, province: '甘肃' },
  { name: '武威', lat: 37.9300, lon: 102.6400, province: '甘肃' },
  { name: '张掖', lat: 38.9300, lon: 100.4500, province: '甘肃' },
  { name: '平凉', lat: 35.5400, lon: 106.6800, province: '甘肃' },
  { name: '酒泉', lat: 39.7400, lon: 98.5100, province: '甘肃' },
  { name: '庆阳', lat: 35.7300, lon: 107.6400, province: '甘肃' },
  { name: '定西', lat: 35.5800, lon: 104.6200, province: '甘肃' },
  { name: '陇南', lat: 33.3900, lon: 104.9200, province: '甘肃' },
  { name: '临夏', lat: 35.5900, lon: 103.2100, province: '甘肃' },
  { name: '甘南', lat: 34.9900, lon: 102.9000, province: '甘肃' },

  // ===== 青海 =====
  { name: '西宁', lat: 36.6171, lon: 101.7782, province: '青海' },
  { name: '海东', lat: 36.5000, lon: 102.1000, province: '青海' },

  // ===== 宁夏 =====
  { name: '银川', lat: 38.4872, lon: 106.2309, province: '宁夏' },
  { name: '石嘴山', lat: 39.0200, lon: 106.3800, province: '宁夏' },
  { name: '吴忠', lat: 37.9900, lon: 106.2000, province: '宁夏' },
  { name: '固原', lat: 36.0100, lon: 106.2800, province: '宁夏' },
  { name: '中卫', lat: 37.5100, lon: 105.1900, province: '宁夏' },

  // ===== 新疆 =====
  { name: '乌鲁木齐', lat: 43.8256, lon: 87.6168, province: '新疆' },
  { name: '克拉玛依', lat: 45.5900, lon: 84.8800, province: '新疆' },
  { name: '吐鲁番', lat: 42.9500, lon: 89.1800, province: '新疆' },
  { name: '哈密', lat: 42.8300, lon: 93.5200, province: '新疆' },
  { name: '昌吉', lat: 44.0100, lon: 87.3000, province: '新疆' },
  { name: '博尔塔拉', lat: 44.8900, lon: 82.0700, province: '新疆' },
  { name: '巴音郭楞', lat: 41.7600, lon: 86.1500, province: '新疆' },
  { name: '阿克苏', lat: 41.1700, lon: 80.2700, province: '新疆' },
  { name: '克孜勒苏', lat: 39.7100, lon: 76.1700, province: '新疆' },
  { name: '喀什', lat: 39.4700, lon: 75.9900, province: '新疆' },
  { name: '和田', lat: 37.1100, lon: 79.9300, province: '新疆' },
  { name: '伊犁', lat: 43.9200, lon: 81.3200, province: '新疆' },
  { name: '塔城', lat: 46.7400, lon: 82.9800, province: '新疆' },
  { name: '阿勒泰', lat: 47.8400, lon: 88.1300, province: '新疆' },

  // ===== 香港 / 澳门 / 台湾 =====
  { name: '香港', lat: 22.3193, lon: 114.1694, province: '香港' },
  { name: '澳门', lat: 22.1987, lon: 113.5439, province: '澳门' },
  { name: '台北', lat: 25.0330, lon: 121.5654, province: '台湾' },
  { name: '高雄', lat: 22.6273, lon: 120.3014, province: '台湾' },
  { name: '台中', lat: 24.1477, lon: 120.6736, province: '台湾' },
];

/**
 * 本地城市搜索（模糊匹配）
 * @param {string} keyword - 城市名关键词
 * @param {number} maxResults - 最大返回数量，默认 10
 * @returns {Array} 匹配的城市列表 [{name, lat, lon, province}]
 */
function searchCities(keyword, maxResults) {
  maxResults = maxResults || 10;
  if (!keyword || !keyword.trim()) return [];
  const kw = keyword.trim();

  // 精确匹配或前缀匹配优先
  const exact = CITIES.filter(c => c.name === kw);
  if (exact.length > 0) return exact.slice(0, maxResults);

  const prefix = CITIES.filter(c => c.name.indexOf(kw) === 0);
  const contains = CITIES.filter(c => c.name.indexOf(kw) > 0);

  // 合并去重，前缀匹配排前面
  const seen = new Set();
  const result = [];
  prefix.concat(contains).forEach(c => {
    if (!seen.has(c.name) && result.length < maxResults) {
      seen.add(c.name);
      result.push(c);
    }
  });
  return result;
}

module.exports = { CITIES, searchCities };
