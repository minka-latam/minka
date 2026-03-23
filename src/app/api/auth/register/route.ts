import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email, password, firstName, lastName, documentId, birthDate, phone } = requestData;

    if (!email || !password || !firstName || !lastName || !documentId || !birthDate || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    let formattedBirthDate: Date;
    try {
      const [day, month, year] = birthDate.split("/");
      formattedBirthDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(formattedBirthDate.getTime())) throw new Error("Invalid date format");
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid birth date format. Please use DD/MM/YYYY" },
        { status: 400 }
      );
    }

    try {
      const existingProfile = await prisma.profile.findFirst({
        where: { OR: [{ email }, { identityNumber: documentId }] },
      });

      if (existingProfile) {
        if (existingProfile.email === email) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: "User with this ID number already exists" },
            { status: 400 }
          );
        }
      }
    } catch (dbError) {
      return NextResponse.json(
        { error: "Failed to validate user information", details: dbError instanceof Error ? dbError.message : "Unknown error" },
        { status: 500 }
      );
    }

    const requestUrl = new URL(request.url);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    try {
      await prisma.profile.create({
        data: {
          id: authData.user.id,
          name: `${firstName} ${lastName}`,
          email,
          passwordHash: "",
          identityNumber: documentId,
          phone,
          birthDate: formattedBirthDate,
          joinDate: new Date(),
          status: "active",
        },
      });
    } catch (dbError) {
      console.error("Error creating profile:", dbError);
      return NextResponse.json(
        { error: "Failed to create user profile", details: dbError instanceof Error ? dbError.message : "Unknown error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: authData.user.id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}