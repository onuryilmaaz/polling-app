using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddPollCategoryDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Polls_PollCategory_CategoryId",
                table: "Polls");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PollCategory",
                table: "PollCategory");

            migrationBuilder.RenameTable(
                name: "PollCategory",
                newName: "PollCategories");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PollCategories",
                table: "PollCategories",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Polls_PollCategories_CategoryId",
                table: "Polls",
                column: "CategoryId",
                principalTable: "PollCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Polls_PollCategories_CategoryId",
                table: "Polls");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PollCategories",
                table: "PollCategories");

            migrationBuilder.RenameTable(
                name: "PollCategories",
                newName: "PollCategory");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PollCategory",
                table: "PollCategory",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Polls_PollCategory_CategoryId",
                table: "Polls",
                column: "CategoryId",
                principalTable: "PollCategory",
                principalColumn: "Id");
        }
    }
}
