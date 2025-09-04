"use client";

import { ExternalLink, FileText, Calendar, Tag, BookOpen, Target } from "lucide-react";
import { Badge } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { TAcsCode } from "@/lib/api/acs";

interface AcsDetailProps {
  code: TAcsCode;
}

export default function AcsDetail({ code }: AcsDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
            {code.code}
          </Badge>
          
          <Badge className={getTypeColorClasses(code.type)}>
            {formatCodeType(code.type)}
          </Badge>

          {code.doc && (
            <Badge variant="secondary">
              {code.doc}
            </Badge>
          )}
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {code.code}: {code.title}
        </h1>

        {code.shortDescription && (
          <p className="text-xl text-gray-600 leading-relaxed">
            {code.shortDescription}
          </p>
        )}
      </div>

      {/* Main Description */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">Description</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {code.description}
          </p>
        </div>
      </div>

      {/* Professional Information Groups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Training Information */}
        {(code.area || code.task) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Training Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {code.area && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subject Area</dt>
                  <dd className="mt-1 text-sm text-gray-900">{code.area}</dd>
                </div>
              )}
              
              {code.task && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Task</dt>
                  <dd className="mt-1 text-sm text-gray-900">{code.task}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Competency Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Badge className={getTypeColorClasses(code.type)}>
                    {formatCodeType(code.type)}
                  </Badge>
                </dd>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Administrative Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Administrative Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {code.version && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{code.version}</dd>
              </div>
            )}
            
            {code.effectiveDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(code.effectiveDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(code.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Document Integration */}
      {(code.document || code.sourcePdfUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Source Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {code.document && (
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Name</dt>
                  <dd className="mt-1 text-base font-medium text-gray-900">{code.document.title}</dd>
                </div>
                
                {code.document.revision && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Revision</dt>
                    <dd className="mt-1 text-sm text-gray-900">{code.document.revision}</dd>
                  </div>
                )}
                
                {code.document.publicationDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Publication Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(code.document.publicationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                )}
              </div>
            )}

            {/* Page Reference with PDF Link */}
            {code.pageNumber && (
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <dt className="text-sm font-medium text-blue-900">Page Reference</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-900">
                      Page {code.pageNumber}
                    </dd>
                  </div>
                  {code.sourcePdfUrl && (
                    <a
                      href={code.sourcePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <FileText className="h-4 w-4" />
                      View PDF
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Additional Document Links */}
            <div className="flex flex-wrap gap-2">
              {code.document?.sourceUrl && (
                <a
                  href={code.document.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Official Document
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              
              {code.sourcePdfUrl && !code.pageNumber && (
                <a
                  href={code.sourcePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <FileText className="h-4 w-4" />
                  Source PDF
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Discovery */}
      {(code.tags && code.tags.length > 0) || (code.synonyms && code.synonyms.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Knowledge Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {code.tags && code.tags.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-900">Related Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {code.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-sm hover:bg-blue-50 hover:border-blue-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {code.synonyms && code.synonyms.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-900">Alternative Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {code.synonyms.map((synonym, index) => (
                    <Badge key={index} variant="secondary" className="text-sm hover:bg-gray-200">
                      {synonym}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print-Friendly Footer */}
      <div className="border-t pt-6 print:block">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Last updated: {new Date(code.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          <div className="hidden text-sm text-gray-500 print:block">
            Source: CFIPros ACS Database - https://cfipros.com/acs-database/{code.slug}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTypeColorClasses(type: "knowledge" | "skill" | "risk_management"): string {
  switch (type) {
    case "knowledge":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "skill":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "risk_management":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function formatCodeType(type: "knowledge" | "skill" | "risk_management"): string {
  switch (type) {
    case "knowledge":
      return "Knowledge";
    case "skill":
      return "Skill";
    case "risk_management":
      return "Risk Management";
    default:
      return type;
  }
}