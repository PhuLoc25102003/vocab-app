import Link from 'next/link';
import { BRAND_NAME } from '@/components/common/logo';
import type { LegalSection } from './components/legal-page';

export const LEGAL_UPDATED_AT = '19/11/2026';

const accountLink = (
  <Link href="/account" className="underline underline-offset-4">
    Tài khoản
  </Link>
);

export const PRIVACY_INTRO = `Trang này nói rõ ${BRAND_NAME} lưu dữ liệu gì của bạn, dùng để làm gì và bạn xoá chúng bằng cách nào.`;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Dữ liệu chúng tôi lưu',
    body: [
      'Thông tin tài khoản: email, tên hiển thị và mật khẩu đã được băm. Chúng tôi không lưu mật khẩu ở dạng đọc được.',
      'Khi bạn đăng nhập bằng Google, chúng tôi chỉ nhận email, tên và mã định danh tài khoản Google của bạn. Chúng tôi không đọc Gmail, danh bạ hay dữ liệu Google khác.',
      'Nội dung bạn tạo: thư mục, bộ từ, thẻ từ và tiến độ học của từng thẻ.',
      'Phiên đăng nhập: địa chỉ IP và tên trình duyệt của mỗi lần đăng nhập, để bạn đăng xuất được trên mọi thiết bị và để phát hiện truy cập bất thường.',
    ],
  },
  {
    title: 'Chúng tôi dùng dữ liệu để làm gì',
    body: [
      'Để đăng nhập, lưu bộ từ, xếp lịch ôn tập và hiện thống kê học tập cho chính bạn.',
      'Để giữ dịch vụ an toàn, ví dụ giới hạn số lần thử đăng nhập và ghi log lỗi. Log chỉ được giữ tạm thời và không chứa mật khẩu hay token.',
      'Chúng tôi không bán dữ liệu, không dùng dữ liệu để quảng cáo và không có công cụ theo dõi của bên thứ ba.',
    ],
  },
  {
    title: 'Cookie và bộ nhớ trình duyệt',
    body: [
      'Một cookie bảo mật giữ phiên đăng nhập. Trình duyệt cũng lưu lựa chọn giao diện sáng hoặc tối và bài đang làm dở, để bạn học tiếp khi tải lại trang.',
    ],
  },
  {
    title: 'Ai được xem dữ liệu của bạn',
    body: [
      'Bộ từ để chế độ riêng tư chỉ bạn xem được. Bộ từ để công khai thì ai cũng xem được nội dung và tên người tạo.',
      'Dữ liệu được lưu trên các nhà cung cấp hạ tầng là Vercel, Render và Neon. Họ chỉ xử lý dữ liệu để vận hành dịch vụ cho chúng tôi.',
    ],
  },
  {
    title: 'Xoá dữ liệu',
    body: [
      <>
        Bạn có thể xoá tài khoản bất cứ lúc nào trong trang {accountLink}. Khi xoá, tài khoản, bộ
        từ, thẻ từ và tiến độ học của bạn bị xoá hẳn và không khôi phục được.
      </>,
    ],
  },
  {
    title: 'Thay đổi chính sách',
    body: ['Khi chính sách thay đổi, chúng tôi cập nhật trang này và ngày cập nhật ở đầu trang.'],
  },
];

export const TERMS_INTRO = `Khi tạo tài khoản hoặc dùng ${BRAND_NAME}, bạn đồng ý với các điều khoản dưới đây.`;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Dịch vụ',
    body: [
      `${BRAND_NAME} là công cụ miễn phí để tạo bộ từ vựng và ôn tập bằng nhiều chế độ học. Dịch vụ đang trong giai đoạn thử nghiệm, có thể thay đổi, tạm dừng hoặc gặp lỗi.`,
    ],
  },
  {
    title: 'Tài khoản',
    body: [
      'Bạn chịu trách nhiệm giữ bí mật mật khẩu và mọi hoạt động trong tài khoản của mình. Mỗi người chỉ nên dùng một tài khoản.',
    ],
  },
  {
    title: 'Nội dung bạn tạo',
    body: [
      'Bộ từ và thẻ từ bạn tạo vẫn thuộc về bạn. Khi để công khai, bạn cho phép người khác xem và sao chép bộ từ đó để học.',
      'Không đăng nội dung vi phạm pháp luật, xúc phạm người khác hoặc vi phạm bản quyền. Chúng tôi có thể ẩn hoặc xoá nội dung như vậy.',
    ],
  },
  {
    title: 'Sử dụng hợp lý',
    body: [
      'Không tìm cách truy cập trái phép, làm quá tải hệ thống hoặc thu thập dữ liệu của người dùng khác. Tài khoản vi phạm có thể bị khoá.',
    ],
  },
  {
    title: 'Giới hạn trách nhiệm',
    body: [
      'Dịch vụ được cung cấp nguyên trạng. Chúng tôi cố gắng giữ dữ liệu an toàn nhưng không cam kết dịch vụ luôn chạy liên tục hay không bao giờ mất dữ liệu.',
    ],
  },
  {
    title: 'Thay đổi điều khoản',
    body: [
      'Khi điều khoản thay đổi, chúng tôi cập nhật trang này. Tiếp tục dùng dịch vụ nghĩa là bạn đồng ý với bản mới.',
    ],
  },
];
