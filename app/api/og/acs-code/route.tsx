import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Dynamic OG image generation for ACS codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const title = searchParams.get("title");
    const area = searchParams.get("area");
    const task = searchParams.get("task");

    if (!code || !title) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // Generate dynamic OG image
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            color: "white",
            position: "relative",
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.3,
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "40px",
              maxWidth: "900px",
            }}
          >
            {/* ACS Code */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                marginBottom: "16px",
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "16px 32px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {code}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "32px",
                fontWeight: "600",
                marginBottom: "20px",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              {title}
            </div>

            {/* Area and Task */}
            {(area || task) && (
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "20px",
                  opacity: 0.9,
                  marginBottom: "24px",
                }}
              >
                {area && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                    }}
                  >
                    Area: {area}
                  </div>
                )}
                {task && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                    }}
                  >
                    Task: {task}
                  </div>
                )}
              </div>
            )}

            {/* CFIPros Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                fontWeight: "600",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "white",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "#667eea",
                  fontWeight: "bold",
                }}
              >
                ✈
              </div>
              CFIPros ACS Database
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: await fetch(
              new URL('../../../../public/fonts/Inter-Regular.ttf', import.meta.url)
            ).then((res) => res.arrayBuffer()),
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: await fetch(
              new URL('../../../../public/fonts/Inter-SemiBold.ttf', import.meta.url)
            ).then((res) => res.arrayBuffer()),
            weight: 600,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: await fetch(
              new URL('../../../../public/fonts/Inter-Bold.ttf', import.meta.url)
            ).then((res) => res.arrayBuffer()),
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
  } catch (error) {
    // Remove console.error for production
    
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
}