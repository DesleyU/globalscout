using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlobalScout.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class PlayerStatisticsDataOnlyDropScalars : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Former 20260414120000 migration (had no Designer, so never applied): add jsonb + source + schema_version.
        migrationBuilder.DropIndex(
            name: "ix_player_statistics_user_id_season",
            table: "player_statistics");

        migrationBuilder.AddColumn<JsonDocument>(
            name: "data",
            table: "player_statistics",
            type: "jsonb",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "schema_version",
            table: "player_statistics",
            type: "character varying(32)",
            maxLength: 32,
            nullable: false,
            defaultValue: "1");

        migrationBuilder.AddColumn<string>(
            name: "source",
            table: "player_statistics",
            type: "character varying(64)",
            maxLength: 64,
            nullable: false,
            defaultValue: "legacy");

        migrationBuilder.CreateIndex(
            name: "ix_player_statistics_user_id_season_source",
            table: "player_statistics",
            columns: ["user_id", "season", "source"],
            unique: true);

        migrationBuilder.DropColumn(
            name: "stats_data",
            table: "profiles");

        migrationBuilder.Sql(
            """
            UPDATE player_statistics
            SET data = jsonb_build_object(
                'kind', 'manual',
                'season', season,
                'goals', goals,
                'assists', assists,
                'matches', matches,
                'minutes', minutes,
                'yellowCards', yellow_cards,
                'redCards', red_cards,
                'rating', rating,
                'shotsTotal', shots_total,
                'shotsOnTarget', shots_on_target,
                'passesTotal', passes_total,
                'passesAccuracy', passes_accuracy,
                'tacklesTotal', tackles_total,
                'tacklesInterceptions', tackles_interceptions,
                'duelsWon', duels_won,
                'foulsCommitted', fouls_committed,
                'foulsDrawn', fouls_drawn
            )
            WHERE data IS NULL AND source = 'manual';
            """);

        migrationBuilder.DropColumn(
            name: "assists",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "duels_won",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "fouls_committed",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "fouls_drawn",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "goals",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "matches",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "minutes",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "passes_accuracy",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "passes_total",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "rating",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "red_cards",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "shots_on_target",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "shots_total",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "tackles_interceptions",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "tackles_total",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "yellow_cards",
            table: "player_statistics");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "assists",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "duels_won",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "fouls_committed",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "fouls_drawn",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "goals",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "matches",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "minutes",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<double>(
            name: "passes_accuracy",
            table: "player_statistics",
            type: "double precision",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "passes_total",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<double>(
            name: "rating",
            table: "player_statistics",
            type: "double precision",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "red_cards",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "shots_on_target",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "shots_total",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "tackles_interceptions",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "tackles_total",
            table: "player_statistics",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "yellow_cards",
            table: "player_statistics",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.DropIndex(
            name: "ix_player_statistics_user_id_season_source",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "data",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "schema_version",
            table: "player_statistics");

        migrationBuilder.DropColumn(
            name: "source",
            table: "player_statistics");

        migrationBuilder.CreateIndex(
            name: "ix_player_statistics_user_id_season",
            table: "player_statistics",
            columns: ["user_id", "season"],
            unique: true);

        migrationBuilder.AddColumn<JsonDocument>(
            name: "stats_data",
            table: "profiles",
            type: "jsonb",
            nullable: true);
    }
}
