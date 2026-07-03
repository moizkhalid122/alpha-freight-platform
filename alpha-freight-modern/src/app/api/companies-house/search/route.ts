import { NextRequest, NextResponse } from "next/server";

const COMPANIES_HOUSE_API_BASE = "https://api.company-information.service.gov.uk";

type CompaniesHouseAddress = {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
};

const mapAddress = (address?: CompaniesHouseAddress | null) => ({
  addressLine1: address?.address_line_1 ?? null,
  addressLine2: address?.address_line_2 ?? null,
  locality: address?.locality ?? null,
  region: address?.region ?? null,
  postalCode: address?.postal_code ?? null,
  country: address?.country ?? null,
});

const getAuthHeader = () => {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    return null;
  }

  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const authorization = getAuthHeader();

  if (!authorization) {
    return NextResponse.json(
      { error: "Companies House API key is not configured." },
      { status: 503 }
    );
  }

  const endpoint = new URL(`${COMPANIES_HOUSE_API_BASE}/search/companies`);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("items_per_page", "6");

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch company suggestions." },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as {
      items?: Array<{
        title?: string;
        company_number?: string;
        company_status?: string;
        address_snippet?: string;
        address?: CompaniesHouseAddress;
      }>;
    };

    return NextResponse.json({
      items: (payload.items ?? []).map((item) => ({
        companyName: item.title ?? "",
        companyNumber: item.company_number ?? "",
        companyStatus: item.company_status ?? null,
        addressSnippet: item.address_snippet ?? null,
        address: mapAddress(item.address),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Companies House right now." },
      { status: 502 }
    );
  }
}
