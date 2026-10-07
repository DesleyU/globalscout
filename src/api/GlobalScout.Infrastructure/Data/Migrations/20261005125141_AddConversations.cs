using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalScout.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Nullable first so existing messages can be backfilled below, then made required.
            migrationBuilder.AddColumn<Guid>(
                name: "conversation_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user1_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user2_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_message_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversations", x => x.id);
                    table.CheckConstraint("ck_conversations_user_order", "user1_id < user2_id");
                    table.ForeignKey(
                        name: "fk_conversations_asp_net_users_user1_id",
                        column: x => x.user1_id,
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_conversations_asp_net_users_user2_id",
                        column: x => x.user2_id,
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            // One conversation per existing message pair, then link each message to it.
            migrationBuilder.Sql(
                """
                INSERT INTO conversations (id, user1_id, user2_id, created_at, last_message_at)
                SELECT gen_random_uuid(), pair.user1_id, pair.user2_id, pair.first_at, pair.last_at
                FROM (
                    SELECT LEAST(sender_id, receiver_id) AS user1_id,
                           GREATEST(sender_id, receiver_id) AS user2_id,
                           MIN(created_at) AS first_at,
                           MAX(created_at) AS last_at
                    FROM messages
                    WHERE sender_id <> receiver_id
                    GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
                ) AS pair;

                UPDATE messages AS m
                SET conversation_id = c.id
                FROM conversations AS c
                WHERE c.user1_id = LEAST(m.sender_id, m.receiver_id)
                  AND c.user2_id = GREATEST(m.sender_id, m.receiver_id);

                DELETE FROM messages WHERE conversation_id IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "conversation_id",
                table: "messages",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_created_at_id",
                table: "messages",
                columns: new[] { "conversation_id", "created_at", "id" },
                descending: new[] { false, true, true });

            migrationBuilder.CreateIndex(
                name: "ix_conversations_user1_id_user2_id",
                table: "conversations",
                columns: new[] { "user1_id", "user2_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_conversations_user2_id",
                table: "conversations",
                column: "user2_id");

            migrationBuilder.AddForeignKey(
                name: "fk_messages_conversations_conversation_id",
                table: "messages",
                column: "conversation_id",
                principalTable: "conversations",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_messages_conversations_conversation_id",
                table: "messages");

            migrationBuilder.DropTable(
                name: "conversations");

            migrationBuilder.DropIndex(
                name: "ix_messages_conversation_id_created_at_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "conversation_id",
                table: "messages");
        }
    }
}
