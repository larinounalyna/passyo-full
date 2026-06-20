"""
Main entry point to run the Smart Estimator API server
"""

if __name__ == "__main__":
    import uvicorn
    from smart_estimator_api import app
    
    print("=" * 80)
    print("SMART ESTIMATOR API SERVER")
    print("=" * 80)
    print("\nStarting server on http://0.0.0.0:8001")
    print("\nAvailable endpoints:")
    print("  • GET  /health                      - Health check")
    print("  • GET  /stages                      - View 5-stage workflow")
    print("  • GET  /api/v2/contextual-wizard   - Wizard specifications")
    print("  • POST /api/v2/estimate            - Generate estimate")
    print("  • POST /api/v2/example/estimate    - Run example estimate")
    print("  • POST /api/v2/wizard/preview      - Preview context impact")
    print("\nAPI Documentation: http://0.0.0.0:8001/docs")
    print("=" * 80 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        log_level="info"
    )
