// Danh sách sản phẩm mẫu cho ngành dệt may (10 loại vải dệt kim)

export interface Product {
  code: string;
  name: string;
  category: string;
  description: string;
  usage: string;
}

export const products: Product[] = [
  {
    code: 'DK01',
    name: 'Single Jersey',
    category: 'Vải dệt kim',
    description: 'Mềm, co giãn, nhẹ, thoáng khí.',
    usage: 'Áo thun, đồ lót, đồ trẻ em',
  },
  {
    code: 'DK02',
    name: 'Rib',
    category: 'Vải dệt kim',
    description: 'Gân nổi, co giãn tốt, dày hơn jersey.',
    usage: 'Bo cổ, bo tay, bo gấu, áo lạnh',
  },
  {
    code: 'DK03',
    name: 'Interlock',
    category: 'Vải dệt kim',
    description: 'Hai mặt giống nhau, dày, mịn, ít bị cuộn mép.',
    usage: 'Áo thun cao cấp, đồ trẻ em',
  },
  {
    code: 'DK04',
    name: 'Pique',
    category: 'Vải dệt kim',
    description: 'Bề mặt có mắt lưới nhỏ, thoáng khí, bền.',
    usage: 'Áo polo, đồng phục',
  },
  {
    code: 'DK05',
    name: 'French Terry',
    category: 'Vải dệt kim',
    description: 'Mặt trái có vòng sợi nhỏ, hút ẩm tốt.',
    usage: 'Áo khoác, quần jogger, đồ thể thao',
  },
  {
    code: 'DK06',
    name: 'Fleece',
    category: 'Vải dệt kim',
    description: 'Mặt trái có lớp lông mịn, giữ ấm tốt.',
    usage: 'Áo khoác, áo hoodie, chăn',
  },
  {
    code: 'DK07',
    name: 'Lacoste',
    category: 'Vải dệt kim',
    description: 'Mắt lưới lớn, dày, bền, sang trọng.',
    usage: 'Áo polo cao cấp',
  },
  {
    code: 'DK08',
    name: 'Modal Jersey',
    category: 'Vải dệt kim',
    description: 'Sợi modal pha cotton, mềm, mát, thấm hút tốt.',
    usage: 'Đồ lót, áo thun cao cấp',
  },
  {
    code: 'DK09',
    name: 'Spandex Jersey',
    category: 'Vải dệt kim',
    description: 'Pha spandex, co giãn 4 chiều, ôm sát cơ thể.',
    usage: 'Đồ thể thao, đồ bơi, đồ tập gym',
  },
  {
    code: 'DK10',
    name: 'Jacquard Knit',
    category: 'Vải dệt kim',
    description: 'Họa tiết dệt trực tiếp, đa dạng hoa văn, bền màu.',
    usage: 'Áo thời trang, váy, đồ cao cấp',
  },
];
