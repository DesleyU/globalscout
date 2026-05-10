using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalScout.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(GlobalScoutDbContext))]
    [Migration("20260510133100_RenameFileStorageKeys")]
    public partial class RenameFileStorageKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "url",
                table: "media",
                newName: "storage_key");

            migrationBuilder.RenameColumn(
                name: "avatar",
                table: "profiles",
                newName: "avatar_storage_key");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "storage_key",
                table: "media",
                newName: "url");

            migrationBuilder.RenameColumn(
                name: "avatar_storage_key",
                table: "profiles",
                newName: "avatar");
        }
    }
}
