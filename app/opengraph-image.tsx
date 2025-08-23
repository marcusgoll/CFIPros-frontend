import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CFIPros - CFI Training Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          backgroundImage: "linear-gradient(135deg, #eff6ff 0%, #f0f0ff 100%)",
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            backgroundColor: "#3b82f6",
            borderRadius: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "48px",
              fontWeight: "bold",
            }}
          >
            CF
          </div>
        </div>

        {/* Main heading */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#111827",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          CFIPros
        </div>

        {/* Subheading */}
        <div
          style={{
            fontSize: "32px",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.2,
          }}
        >
          Master Aviation Standards with AI-Powered Study Plans
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            marginTop: "60px",
            gap: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#3b82f6",
              }}
            >
              200+
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              ACS Codes
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#3b82f6",
              }}
            >
              95%
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              Pass Rate
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#3b82f6",
              }}
            >
              10k+
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              Users
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}