import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1757000000000 implements MigrationInterface {
  name = 'InitSchema1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "commute_posts_type_enum" AS ENUM ('OFFERING', 'LOOKING')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(120) NOT NULL,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "commute_posts" (
        "id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "owner_id" uuid NOT NULL,
        "type" "commute_posts_type_enum" NOT NULL,
        "origin" varchar(160) NOT NULL,
        "destination" varchar(160) NOT NULL,
        "departure_at" TIMESTAMPTZ NOT NULL,
        "seats_available" smallint NOT NULL,
        "notes" text,
        CONSTRAINT "PK_commute_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_commute_posts_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_commute_posts_origin" ON "commute_posts" ("origin")`);
    await queryRunner.query(`CREATE INDEX "IDX_commute_posts_destination" ON "commute_posts" ("destination")`);
    await queryRunner.query(`CREATE INDEX "IDX_commute_posts_owner_id" ON "commute_posts" ("owner_id")`);

    await queryRunner.query(`
      CREATE TABLE "interests" (
        "id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "post_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_interests_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_interests_post_user" UNIQUE ("post_id", "user_id"),
        CONSTRAINT "FK_interests_post" FOREIGN KEY ("post_id") REFERENCES "commute_posts" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_interests_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_interests_post_id" ON "interests" ("post_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_interests_user_id" ON "interests" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "interests"`);
    await queryRunner.query(`DROP TABLE "commute_posts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "commute_posts_type_enum"`);
  }
}
