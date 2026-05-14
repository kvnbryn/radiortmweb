import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Method GET: Mengambil semua data kategori dari MySQL dengan jumlah channel
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            tvChannels: true,
            radios: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });
    
    // Pastikan mengembalikan array kosong jika tidak ada data, bukan null
    return NextResponse.json({ 
      success: true, 
      data: categories || [] 
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Terjadi kesalahan saat mengambil data kategori dari database" 
    }, { status: 500 });
  }
}

// Method POST: Menambahkan kategori baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, color, thumbnail } = body;

    if (!name || !slug) {
      return NextResponse.json({ 
        success: false, 
        message: "Nama dan Slug kategori wajib diisi" 
      }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        color: color || "bg-red-500",
        thumbnail: thumbnail || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newCategory, 
      message: "Kategori berhasil ditambahkan" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal membuat kategori baru. Pastikan slug atau nama belum digunakan." 
    }, { status: 500 });
  }
}

// Method PATCH: Mengupdate kategori yang sudah ada
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, color, thumbnail } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: "ID kategori diperlukan untuk melakukan update" 
      }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        color,
        thumbnail,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedCategory, 
      message: "Kategori berhasil diperbarui" 
    });

  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal memperbarui kategori di database" 
    }, { status: 500 });
  }
}

// Method DELETE: Menghapus kategori
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: "ID kategori diperlukan untuk menghapus data" 
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Kategori berhasil dihapus secara permanen" 
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal menghapus kategori. Pastikan kategori tidak sedang digunakan oleh channel TV atau Radio manapun." 
    }, { status: 500 });
  }
}