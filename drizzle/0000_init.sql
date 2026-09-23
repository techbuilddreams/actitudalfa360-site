CREATE TABLE `orders` (
	`id` char(36) NOT NULL,
	`payment_ref` varchar(255) NOT NULL,
	`status` enum('paid','fulfillment_pending','fulfillment_processing','fulfillment_created','fulfillment_failed') NOT NULL,
	`lines` json NOT NULL,
	`total_cents` int unsigned NOT NULL,
	`currency` char(3) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`shipping` json,
	`fulfillment_ref` varchar(64),
	`claimed_at` timestamp,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_payment_ref_uq` UNIQUE(`payment_ref`),
	CONSTRAINT `orders_currency_ck` CHECK(`orders`.`currency` = 'usd'),
	CONSTRAINT `orders_lines_ck` CHECK(JSON_LENGTH(`orders`.`lines`) > 0)
);
--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);