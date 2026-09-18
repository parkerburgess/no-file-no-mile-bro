import { NextResponse } from "next/server";

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function unauthorized(error: string) {
  return NextResponse.json({ error }, { status: 401 });
}

export function forbidden(error: string) {
  return NextResponse.json({ error }, { status: 403 });
}

export function notFound(error: string) {
  return NextResponse.json({ error }, { status: 404 });
}

export function unprocessable(error: string) {
  return NextResponse.json({ error }, { status: 422 });
}

export function serverError(error: string) {
  return NextResponse.json({ error }, { status: 500 });
}
