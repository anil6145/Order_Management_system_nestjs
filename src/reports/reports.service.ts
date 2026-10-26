import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

type salesGroupBy = 'day' | 'month';

@Injectable()
export class ReportsService {

    constructor(
        private readonly dataSource : DataSource
    ){}

    async getSalesSummary(query: SalesSummaryQueryDto) {
    const { fromDate, toDate, groupBy = 'day' } = query;

    // 1. Validate the date range.
    if (fromDate > toDate) {
      throw new BadRequestException(
        'fromDate must be before or equal to toDate',
      );
    }

    // 2. Validate the maximum report range if required.
    const start = new Date(`${fromDate}`);
    const end = new Date(`${toDate}`);

    const days =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24);

    if (days > 366) {
      throw new BadRequestException(
        'Date range cannot exceed 367 calendar dates',
      );
    }

    // 3. Execute the aggregation in PostgreSQL.
    const sql = `
      WITH calendar AS (
        SELECT generate_series(
          CASE
            WHEN $3 = 'month'
              THEN date_trunc('month', $1::date)
            ELSE $1::date
          END,
          CASE
            WHEN $3 = 'month'
              THEN date_trunc('month', $2::date)
            ELSE $2::date
          END,
          CASE
            WHEN $3 = 'month'
              THEN interval '1 month'
            ELSE interval '1 day'
          END
        )::date AS period
      ),

      order_totals AS (
        SELECT
          date_trunc(
            $3,
            o.created_at AT TIME ZONE 'Asia/Kolkata'
          )::date AS period,
          COUNT(*) AS order_count,
          COALESCE(SUM(o.total_amount), 0) AS revenue
        FROM order_management.orders o
        WHERE
          (o.created_at AT TIME ZONE 'Asia/Kolkata')::date
            BETWEEN $1::date AND $2::date
          AND o.status IN ('COMPLETED', 'CONFIRMED')
        GROUP BY 1
      ),

      item_totals AS (
        SELECT
          date_trunc(
            $3,
            o.created_at AT TIME ZONE 'Asia/Kolkata'
          )::date AS period,
          COALESCE(SUM(oi.quantity), 0) AS items_sold
        FROM order_management.orders o
        INNER JOIN order_management.order_items oi
          ON oi.order_id = o.id
        WHERE
          (o.created_at AT TIME ZONE 'Asia/Kolkata')::date
            BETWEEN $1::date AND $2::date
          AND o.status IN ('COMPLETED', 'CONFIRMED')
        GROUP BY 1
      )

      SELECT
        TO_CHAR(c.period, 'YYYY-MM-DD') AS period,
        COALESCE(ot.order_count, 0) AS order_count,
        COALESCE(it.items_sold, 0) AS items_sold,
        COALESCE(ot.revenue, 0) AS revenue
      FROM calendar c
      LEFT JOIN order_totals ot
        ON ot.period = c.period
      LEFT JOIN item_totals it
        ON it.period = c.period
      ORDER BY c.period ASC;
    `;

    const data = await this.dataSource.query(sql, [
      fromDate,
      toDate,
      groupBy,
    ]);

    return {
      fromDate,
      toDate,
      groupBy,
      data,
    };
  }

  
async exportSalesSummary(query: SalesSummaryQueryDto): Promise<PassThrough> {
  const { fromDate, toDate, groupBy = 'day' } = query;

  // Validate the dates before starting the database stream.
  if (fromDate > toDate) {
    throw new BadRequestException(
      'fromDate must be before or equal to toDate',
    );
  }

  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);

  const days =
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (!Number.isFinite(days) || days < 0 || days > 366) {
    throw new BadRequestException(
      'Date range cannot exceed 367 calendar dates',
    );
  }

  // Use the same aggregation rules as getSalesSummary().
  const sql = `
    WITH calendar AS (
      SELECT generate_series(
        CASE
          WHEN $3 = 'month'
            THEN date_trunc('month', $1::date)
          ELSE $1::date
        END,
        CASE
          WHEN $3 = 'month'
            THEN date_trunc('month', $2::date)
          ELSE $2::date
        END,
        CASE
          WHEN $3 = 'month'
            THEN interval '1 month'
          ELSE interval '1 day'
        END
      )::date AS period
    ),

    order_totals AS (
      SELECT
        date_trunc(
          $3,
          o.created_at AT TIME ZONE 'Asia/Kolkata'
        )::date AS period,
        COUNT(*) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM order_management.orders o
      WHERE
        (o.created_at AT TIME ZONE 'Asia/Kolkata')::date
          BETWEEN $1::date AND $2::date
        AND o.status IN ('COMPLETED', 'CONFIRMED')
      GROUP BY 1
    ),

    item_totals AS (
      SELECT
        date_trunc(
          $3,
          o.created_at AT TIME ZONE 'Asia/Kolkata'
        )::date AS period,
        COALESCE(SUM(oi.quantity), 0) AS items_sold
      FROM order_management.orders o
      INNER JOIN order_management.order_items oi
        ON oi.order_id = o.id
      WHERE
        (o.created_at AT TIME ZONE 'Asia/Kolkata')::date
          BETWEEN $1::date AND $2::date
        AND o.status IN ('COMPLETED', 'CONFIRMED')
      GROUP BY 1
    )

    SELECT
      TO_CHAR(c.period, 'YYYY-MM-DD') AS period,
      COALESCE(ot.order_count, 0) AS order_count,
      COALESCE(it.items_sold, 0) AS items_sold,
      COALESCE(ot.revenue, 0) AS revenue
    FROM calendar c
    LEFT JOIN order_totals ot
      ON ot.period = c.period
    LEFT JOIN item_totals it
      ON it.period = c.period
    ORDER BY c.period ASC;
  `;

  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();

  let databaseStream;

  try {
    databaseStream = await queryRunner.stream(sql, [
      fromDate,
      toDate,
      groupBy,
    ]);
  } catch (error) {
    await queryRunner.release();
    throw error;
  }

  let headerWritten = false;

  const csvTransform = new Transform({
    writableObjectMode: true,

    transform(row, _encoding, callback) {
      try {
        let output = '';

        if (!headerWritten) {
          output +=
            'Period,Order Count,Items Sold,Revenue\r\n';
          headerWritten = true;
        }

        const values = [
          row.period,
          row.order_count,
          row.items_sold,
          row.revenue,
        ];

        const csvRow = values
          .map((value) => {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(',');

        callback(null, output + csvRow + '\r\n');
      } catch (error) {
        callback(error as Error);
      }
    },

    flush(callback) {
      // Include the CSV headers even when no rows are returned.
      if (!headerWritten) {
        this.push(
          'Period,Order Count,Items Sold,Revenue\r\n',
        );
      }

      callback();
    },
  });

  const output = new PassThrough();

  // Stream rows into the CSV converter and then to the response.
  // pipeline handles stream errors and propagates destruction.
  void pipeline(
    databaseStream,
    csvTransform,
    output,
  )
    .catch((error: Error) => {
      output.destroy(error);
    })
    .finally(async () => {
      await queryRunner.release();
    });

  return output;
}



  async getTopProducts(query: TopProductsQueryDto) {
  const { fromDate, toDate, limit = 5 } = query;

  // 1. Validate the date range.
  if (fromDate > toDate) {
    throw new BadRequestException(
      'fromDate must be before or equal to toDate',
    );
  }

  // 2. Calculate the inclusive number of calendar dates.
  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);

  const days =
    (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24) +
    1;

  if (days > 366) {
    throw new BadRequestException(
      'Date range cannot exceed 366 calendar dates',
    );
  }

  // 3. Calculate product sales inside PostgreSQL.
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      COALESCE(SUM(oi.quantity), 0)::bigint
        AS quantity_sold,
      COALESCE(SUM(oi.line_total), 0)::numeric
        AS revenue
    FROM order_management.order_items oi

    INNER JOIN order_management.orders o
      ON o.id = oi.order_id

    INNER JOIN order_management.products p
      ON p.id = oi.product_id

    WHERE
      o.status <> 'CANCELLED'

      AND o.created_at >= (
        $1::date::timestamp
        AT TIME ZONE 'Asia/Kolkata'
      )

      AND o.created_at < (
        ($2::date + 1)::timestamp
        AT TIME ZONE 'Asia/Kolkata'
      )

    GROUP BY
      p.id,
      p.name

    ORDER BY
      SUM(oi.quantity) DESC,
      p.id ASC

    LIMIT $3;
  `;

  // 4. Execute one parameterized SQL statement.
  const rows = await this.dataSource.query(sql, [
    fromDate,
    toDate,
    limit,
  ]);

  // 5. Return a consistent response structure.
  return {
    fromDate,
    toDate,
    limit,
    data: rows.map((row: {
      product_id: string;
      product_name: string;
      quantity_sold: string | number;
      revenue: string | number;
    }) => ({
      productId: row.product_id,
      productName: row.product_name,
      quantitySold: Number(row.quantity_sold),
      revenue: Number(row.revenue),
    })),
  };
}



async getLowStockProducts() {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.sku AS sku,
      p.stock AS stock,
      p.low_stock_threshold AS low_stock_threshold
    FROM order_management.products p
    WHERE
      p.status = 'ACTIVE'
      AND p.stock <= p.low_stock_threshold
      AND p.deleted_at IS NULL
    ORDER BY
      p.stock ASC,
      p.id ASC;
  `;

  const rows = await this.dataSource.query(sql);

  return rows.map((row: {
    product_id: string;
    product_name: string;
    sku: string;
    stock: number | string;
    low_stock_threshold: number | string;
  }) => ({
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    stock: Number(row.stock),
    lowStockThreshold: Number(row.low_stock_threshold),
  }));
}

}
