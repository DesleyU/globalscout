using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalScout.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConversationReadState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "user1_last_read_at",
                table: "conversations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "user2_last_read_at",
                table: "conversations",
                type: "timestamp with time zone",
                nullable: true);

            // Each user's read position = their newest received message that was marked read.
            migrationBuilder.Sql(
                """
                UPDATE conversations AS c
                SET user1_last_read_at = (
                        SELECT MAX(m.created_at) FROM messages AS m
                        WHERE m.conversation_id = c.id AND m.receiver_id = c.user1_id AND m.is_read),
                    user2_last_read_at = (
                        SELECT MAX(m.created_at) FROM messages AS m
                        WHERE m.conversation_id = c.id AND m.receiver_id = c.user2_id AND m.is_read);
                """);

            migrationBuilder.DropColumn(
                name: "is_read",
                table: "messages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "user1_last_read_at",
                table: "conversations");

            migrationBuilder.DropColumn(
                name: "user2_last_read_at",
                table: "conversations");

            migrationBuilder.AddColumn<bool>(
                name: "is_read",
                table: "messages",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
