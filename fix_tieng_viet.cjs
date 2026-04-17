const fs = require('fs');
const path = require('path');

const replacements = {
  "'Tim kiem'": "'Tìm kiếm'",
  "'So phieu thu, khach hang...'": "'Số phiếu thu, khách hàng...'",
  "'So phieu, mo ta...'": "'Số phiếu, mô tả...'",
  "'Ten hoac ma NCC...'": "'Tên hoặc mã NCC...'",
  "'Danh muc'": "'Danh mục'",
  "'Trang thai'": "'Trạng thái'",
  "'Ten, ma, SDT...'": "'Tên, mã, SĐT...'",
  "'Vai tro'": "'Vai trò'",
  "'Quan tri vien'": "'Quản trị viên'",
  "'Kho bai'": "'Kho bãi'",
  "'Tai xe'": "'Tài xế'",
  "'Ma lenh, nha cung cap...'": "'Mã lệnh, nhà cung cấp...'",
  "'Ma lenh san xuat...'": "'Mã lệnh sản xuất...'",
  "'So phieu gia cong...'": "'Số phiếu gia công...'",
  "'Nhap'": "'Nháp'",
  "'Da xac nhan'": "'Đã xác nhận'",
  "'Da thanh toan'": "'Đã thanh toán'",
  "'So hop dong, ten doi tac...'": "'Số hợp đồng, tên đối tác...'",
  "'Loai hop dong'": "'Loại hợp đồng'",
  "'Ten, ma, thanh phan...'": "'Tên, mã, thành phần...'",
  "'Dang dung'": "'Đang dùng'",
  "'Ngung dung'": "'Ngừng dùng'",
  "'Loai vai'": "'Loại vải'",
  "'Tim loai vai...'": "'Tìm loại vải...'",
  "'Chat luong'": "'Chất lượng'",
  "'Khong tim thay nhan vien'": "'Không tìm thấy nhân viên'",
  "'Chua co du lieu nhan vien'": "'Chưa có dữ liệu nhân viên'",
  "'Vui long thu dieu chinh lai bo loc.'": "'Vui lòng thử điều chỉnh lại bộ lọc.'",
  "'Hay them nhan vien moi de bat dau quan ly.'": "'Hãy thêm nhân viên mới để bắt đầu quản lý.'",
  "'+ Them nhan vien'": "'+ Thêm nhân viên'"
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/features');
let changedAny = false;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
    changedAny = true;
  }
}
if (!changedAny) console.log('No files needed exact fix.');
