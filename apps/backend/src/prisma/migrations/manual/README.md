# Manual SQL Migrations

Đặt file `.sql` vào thư mục này. Khi chạy `bash scripts/rebuild.sh --sql`, tất cả
file sẽ được thực thi theo thứ tự **alphabet** (nên đặt tên theo ngày: `YYYYMMDD_desc.sql`).

Script sẽ tự bỏ qua nếu migration đã được apply (lỗi "Duplicate key / already exists").

## Ví dụ đặt tên file:

```
20240701_fix_referral_unique.sql
20240715_add_cashback_index.sql
20240720_add_merchant_campaign.sql
```

## Ví dụ nội dung file:

```sql
-- 20240701_fix_referral_unique.sql
-- Mô tả: Đổi unique constraint trên bảng referrals

ALTER TABLE `referrals` DROP INDEX IF EXISTS `referrals_toUserId_key`;
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_toUserId_level_key` UNIQUE (`toUserId`, `level`);
CREATE INDEX IF NOT EXISTS `referrals_toUserId_idx` ON `referrals`(`toUserId`);
```
