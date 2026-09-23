CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`payment_ref` varchar(255) NOT NULL,
	`status` varchar(32) NOT NULL,
	`lines` json NOT NULL,
	`total_cents` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`shipping` json,
	`fulfillment_ref` varchar(64),
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_payment_ref_uq` UNIQUE(`payment_ref`)
);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);