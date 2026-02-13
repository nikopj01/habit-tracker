using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HabitTracker.Infrastructure.Migrations
{
    public partial class AddMonthlyActivityPlanningAndActivityIcons : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Activities",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "✅");

            migrationBuilder.CreateTable(
                name: "UserMonthlyActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMonthlyActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMonthlyActivities_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMonthlyActivities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserMonthlyActivities_ActivityId",
                table: "UserMonthlyActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMonthlyActivities_UserId_ActivityId_Year_Month",
                table: "UserMonthlyActivities",
                columns: new[] { "UserId", "ActivityId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserMonthlyActivities_UserId_Year_Month",
                table: "UserMonthlyActivities",
                columns: new[] { "UserId", "Year", "Month" });

            migrationBuilder.CreateIndex(
                name: "IX_UserMonthlyActivities_UserId_Year_Month_IsActive",
                table: "UserMonthlyActivities",
                columns: new[] { "UserId", "Year", "Month", "IsActive" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserMonthlyActivities");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Activities");
        }
    }
}
