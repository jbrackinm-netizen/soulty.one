export async function GET() {
  try {
    return Response.json({
      success: true,
      message: 'Server ready. Visit /api/seed to initialize database.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error',
      },
      { status: 500 }
    );
  }
}
