import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readConfigs, readCreators, writeConfigs } from "@/lib/csv";
import type { Config } from "@/lib/types";

function getAvailableCategories() {
  return [...new Set(readCreators().map((creator) => creator.category).filter(Boolean))].sort();
}

function validateConfigInput(body: {
  configName?: string;
  creatorsCategory?: string;
  analysisInstruction?: string;
  newConceptsInstruction?: string;
}) {
  const configName = body.configName?.trim() || "";
  const creatorsCategory = body.creatorsCategory?.trim() || "";
  const analysisInstruction = body.analysisInstruction?.trim() || "";
  const newConceptsInstruction = body.newConceptsInstruction?.trim() || "";
  const availableCategories = getAvailableCategories();

  if (!configName) {
    return { error: "configName is required" };
  }

  if (!creatorsCategory) {
    return { error: "creatorsCategory is required" };
  }

  if (!availableCategories.includes(creatorsCategory)) {
    return { error: `creatorsCategory must match an existing creator category: ${availableCategories.join(", ")}` };
  }

  return {
    configName,
    creatorsCategory,
    analysisInstruction,
    newConceptsInstruction,
  };
}

export async function GET() {
  const configs = readConfigs();
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const validated = validateConfigInput(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const configs = readConfigs();
  const newConfig: Config = {
    id: uuid(),
    configName: validated.configName,
    creatorsCategory: validated.creatorsCategory,
    analysisInstruction: validated.analysisInstruction,
    newConceptsInstruction: validated.newConceptsInstruction,
  };
  configs.push(newConfig);
  writeConfigs(configs);
  return NextResponse.json(newConfig, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const validated = validateConfigInput(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const configs = readConfigs();
  const index = configs.findIndex((c) => c.id === body.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  configs[index] = {
    ...configs[index],
    configName: validated.configName,
    creatorsCategory: validated.creatorsCategory,
    analysisInstruction: validated.analysisInstruction,
    newConceptsInstruction: validated.newConceptsInstruction,
  };
  writeConfigs(configs);
  return NextResponse.json(configs[index]);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const configs = readConfigs();
  const filtered = configs.filter((c) => c.id !== id);
  writeConfigs(filtered);
  return NextResponse.json({ success: true });
}
