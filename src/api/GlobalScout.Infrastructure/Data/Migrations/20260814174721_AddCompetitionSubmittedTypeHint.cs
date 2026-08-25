using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalScout.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetitionSubmittedTypeHint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "submitted_type_hint",
                table: "reference_competitions",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "submitted_type_hint",
                table: "reference_competitions");
        }
    }
}
